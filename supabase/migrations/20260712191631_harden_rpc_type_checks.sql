create or replace function public.create_restaurant_invitation(
  target_restaurant_id uuid,
  invite_email text,
  invite_role public.member_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  actor_role public.member_role;
  normalized_email text := lower(trim(invite_email));
  invitation_token uuid;
begin
  select member.role
  into actor_role
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.user_id = current_user_id
    and member.status = 'active';

  if actor_role not in ('owner', 'manager') then
    raise exception 'Not authorized to invite restaurant members';
  end if;

  if invite_role = 'owner' or (actor_role = 'manager' and invite_role = 'manager') then
    raise exception 'Not authorized to assign this role';
  end if;

  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid email address is required';
  end if;

  update public.restaurant_invitations invitation
  set revoked_at = now()
  where invitation.restaurant_id = target_restaurant_id
    and invitation.email = normalized_email
    and invitation.accepted_at is null
    and invitation.revoked_at is null;

  insert into public.restaurant_invitations (
    restaurant_id,
    email,
    role,
    invited_by
  )
  values (
    target_restaurant_id,
    normalized_email,
    invite_role,
    current_user_id
  )
  returning token into invitation_token;

  return invitation_token;
end;
$$;

create or replace function public.remove_restaurant_member(
  target_restaurant_id uuid,
  target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.member_role;
  target_role public.member_role;
  owner_count integer;
begin
  select member.role
  into actor_role
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.user_id = (select auth.uid())
    and member.status = 'active';

  select member.role
  into target_role
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.user_id = target_user_id
    and member.status = 'active'
  for update;

  if target_role is null then
    raise exception 'Restaurant member not found';
  end if;

  if actor_role = 'manager' and target_role in ('owner', 'manager') then
    raise exception 'Managers cannot remove owners or other managers';
  end if;

  if actor_role not in ('owner', 'manager') then
    raise exception 'Not authorized to remove restaurant members';
  end if;

  if target_role = 'owner' then
    select count(*)
    into owner_count
    from public.restaurant_members member
    where member.restaurant_id = target_restaurant_id
      and member.role = 'owner'
      and member.status = 'active';

    if owner_count <= 1 then
      raise exception 'A restaurant must keep at least one active owner';
    end if;
  end if;

  delete from public.restaurant_members
  where restaurant_id = target_restaurant_id
    and user_id = target_user_id;

  return true;
end;
$$;

create or replace function public.create_order(
  target_restaurant_id uuid,
  order_items jsonb,
  order_kind public.order_type default 'dine_in',
  target_table_id uuid default null,
  target_customer_name text default null,
  target_customer_phone text default null,
  order_notes text default null,
  target_delivery_address jsonb default null,
  requested_payment_method public.payment_method default null,
  pay_now boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_order_id uuid := gen_random_uuid();
  line_item jsonb;
  selected_product public.products%rowtype;
  item_product_id uuid;
  item_quantity numeric(10, 3);
  item_discount numeric(12, 2);
  calculated_subtotal numeric(12, 2) := 0;
  calculated_discount numeric(12, 2) := 0;
  calculated_tax numeric(12, 2) := 0;
  calculated_total numeric(12, 2) := 0;
  restaurant_tax_rate numeric(5, 2);
  delivery_customer_lat numeric(9, 6);
  delivery_customer_lng numeric(9, 6);
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not private.has_restaurant_role(
    target_restaurant_id,
    array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]
  ) then
    raise exception 'Not authorized to create orders for this restaurant';
  end if;

  if jsonb_typeof(order_items) <> 'array'
    or jsonb_array_length(order_items) = 0
    or jsonb_array_length(order_items) > 100 then
    raise exception 'Order must contain between 1 and 100 items';
  end if;

  select restaurant.tax_rate
  into restaurant_tax_rate
  from public.restaurants restaurant
  where restaurant.id = target_restaurant_id;

  if not found then
    raise exception 'Restaurant not found';
  end if;

  if order_kind = 'dine_in' then
    if target_table_id is null or not exists (
      select 1
      from public.restaurant_tables restaurant_table
      where restaurant_table.id = target_table_id
        and restaurant_table.restaurant_id = target_restaurant_id
    ) then
      raise exception 'A valid table is required for dine-in orders';
    end if;
  else
    target_table_id := null;
  end if;

  if order_kind = 'delivery'
    and (target_delivery_address is null or jsonb_typeof(target_delivery_address) <> 'object') then
    raise exception 'A delivery address is required for delivery orders';
  end if;

  if pay_now and requested_payment_method is null then
    raise exception 'A payment method is required for immediate payment';
  end if;

  if order_kind = 'delivery' and target_delivery_address #>> '{location,lat}' is not null then
    begin
      delivery_customer_lat := (target_delivery_address #>> '{location,lat}')::numeric;
      delivery_customer_lng := (target_delivery_address #>> '{location,lng}')::numeric;
    exception when others then
      raise exception 'Delivery coordinates are invalid';
    end;

    if delivery_customer_lat not between -90 and 90
      or delivery_customer_lng not between -180 and 180 then
      raise exception 'Delivery coordinates are outside the valid range';
    end if;
  end if;

  insert into public.orders (
    id,
    restaurant_id,
    table_id,
    type,
    requested_payment_method,
    customer_name,
    customer_phone,
    notes,
    delivery_address,
    created_by
  )
  values (
    new_order_id,
    target_restaurant_id,
    target_table_id,
    order_kind,
    requested_payment_method,
    nullif(trim(target_customer_name), ''),
    nullif(trim(target_customer_phone), ''),
    nullif(trim(order_notes), ''),
    target_delivery_address,
    current_user_id
  );

  for line_item in select value from jsonb_array_elements(order_items)
  loop
    begin
      item_product_id := (line_item ->> 'product_id')::uuid;
      item_quantity := (line_item ->> 'quantity')::numeric;
    exception when others then
      raise exception 'Each order item must contain a valid product_id and quantity';
    end;

    if item_quantity <= 0 or item_quantity > 1000 then
      raise exception 'Order item quantity is outside the allowed range';
    end if;

    select product.*
    into selected_product
    from public.products product
    where product.id = item_product_id
      and product.restaurant_id = target_restaurant_id
      and product.is_available = true
    for share;

    if not found then
      raise exception 'Product % is unavailable or does not belong to this restaurant', item_product_id;
    end if;

    item_discount := round(
      item_quantity * selected_product.price * selected_product.discount_percent / 100,
      2
    );
    calculated_subtotal := calculated_subtotal + round(item_quantity * selected_product.price, 2);
    calculated_discount := calculated_discount + item_discount;

    insert into public.order_items (
      restaurant_id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      discount_amount,
      notes
    )
    values (
      target_restaurant_id,
      new_order_id,
      selected_product.id,
      selected_product.name,
      item_quantity,
      selected_product.price,
      item_discount,
      nullif(trim(line_item ->> 'notes'), '')
    );
  end loop;

  calculated_tax := round(
    (calculated_subtotal - calculated_discount) * restaurant_tax_rate / 100,
    2
  );
  calculated_total := calculated_subtotal - calculated_discount + calculated_tax;

  update public.orders
  set
    subtotal = calculated_subtotal,
    discount_amount = calculated_discount,
    tax_amount = calculated_tax,
    total_amount = calculated_total,
    payment_status = case
      when pay_now then 'paid'::public.payment_status
      else 'pending'::public.payment_status
    end
  where id = new_order_id;

  if pay_now then
    if calculated_total <= 0 then
      raise exception 'A zero-value order cannot record a payment';
    end if;

    insert into public.payments (
      restaurant_id,
      order_id,
      amount,
      method,
      status,
      processed_by
    )
    values (
      target_restaurant_id,
      new_order_id,
      calculated_total,
      requested_payment_method,
      'paid',
      current_user_id
    );
  end if;

  if order_kind = 'delivery' then
    insert into public.deliveries (
      restaurant_id,
      order_id,
      customer_lat,
      customer_lng
    )
    values (
      target_restaurant_id,
      new_order_id,
      delivery_customer_lat,
      delivery_customer_lng
    );
  end if;

  if target_table_id is not null then
    update public.restaurant_tables
    set status = 'occupied'
    where id = target_table_id
      and restaurant_id = target_restaurant_id;
  end if;

  return new_order_id;
end;
$$;

create or replace function public.assign_delivery_courier(
  target_order_id uuid,
  target_courier_user_id uuid
)
returns public.delivery_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_delivery public.deliveries%rowtype;
begin
  select delivery.*
  into target_delivery
  from public.deliveries delivery
  where delivery.order_id = target_order_id
  for update;

  if not found then
    raise exception 'Delivery not found';
  end if;

  if not private.has_restaurant_role(
    target_delivery.restaurant_id,
    array['owner', 'manager', 'cashier']::public.member_role[]
  ) then
    raise exception 'Not authorized to assign couriers';
  end if;

  if target_delivery.status not in ('pending', 'assigned') then
    raise exception 'An active or completed delivery cannot be reassigned';
  end if;

  if not exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = target_delivery.restaurant_id
      and member.user_id = target_courier_user_id
      and member.role = 'courier'
      and member.status = 'active'
  ) then
    raise exception 'Courier is not an active member of this restaurant';
  end if;

  if exists (
    select 1
    from public.deliveries other_delivery
    where other_delivery.restaurant_id = target_delivery.restaurant_id
      and other_delivery.courier_user_id = target_courier_user_id
      and other_delivery.order_id <> target_order_id
      and other_delivery.status in ('assigned', 'en_route')
  ) then
    raise exception 'Courier already has an active delivery';
  end if;

  update public.deliveries
  set
    courier_user_id = target_courier_user_id,
    status = 'assigned',
    assigned_at = coalesce(assigned_at, now())
  where id = target_delivery.id;

  return 'assigned'::public.delivery_status;
end;
$$;
