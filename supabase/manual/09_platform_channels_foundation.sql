begin;

-- Kanal, 3. parti entegrasyon, tüketici siparişi, e-posta kuyruğu ve teslimat bölgeleri temeli.
-- Remote'a 20260716 tarihli 'platform_channels_foundation' migration'ı olarak uygulandı.

do $$ begin
  create type public.order_channel as enum ('pos','web','mobile','yemeksepeti','getir','trendyol');
exception when duplicate_object then null; end; $$;

do $$ begin
  create type public.channel_integration_status as enum ('pending','active','paused','error');
exception when duplicate_object then null; end; $$;

do $$ begin
  create type public.webhook_event_status as enum ('received','processed','duplicate','failed');
exception when duplicate_object then null; end; $$;

do $$ begin
  create type public.email_status as enum ('queued','sent','failed');
exception when duplicate_object then null; end; $$;

alter table public.orders
  add column if not exists channel public.order_channel not null default 'pos',
  add column if not exists external_id text;

create unique index if not exists orders_channel_external_id_key
  on public.orders (restaurant_id, channel, external_id)
  where external_id is not null;

create index if not exists orders_restaurant_channel_idx on public.orders (restaurant_id, channel);

create table if not exists public.channel_integrations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  provider public.order_channel not null check (provider in ('yemeksepeti','getir','trendyol')),
  status public.channel_integration_status not null default 'pending',
  webhook_secret uuid not null default gen_random_uuid(),
  settings jsonb not null default '{}'::jsonb,
  error_message text,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, provider)
);

drop trigger if exists channel_integrations_set_updated_at on public.channel_integrations;
create trigger channel_integrations_set_updated_at
before update on public.channel_integrations
for each row execute function private.set_updated_at();

alter table public.channel_integrations enable row level security;

drop policy if exists channel_integrations_management_select on public.channel_integrations;
create policy channel_integrations_management_select on public.channel_integrations
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

drop policy if exists channel_integrations_management_insert on public.channel_integrations;
create policy channel_integrations_management_insert on public.channel_integrations
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

drop policy if exists channel_integrations_management_update on public.channel_integrations;
create policy channel_integrations_management_update on public.channel_integrations
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

drop policy if exists channel_integrations_management_delete on public.channel_integrations;
create policy channel_integrations_management_delete on public.channel_integrations
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

revoke all on table public.channel_integrations from anon, authenticated;
grant select, insert, update, delete on table public.channel_integrations to authenticated;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  integration_id uuid references public.channel_integrations (id) on delete set null,
  provider public.order_channel not null,
  external_id text,
  event_type text not null default 'order.created',
  payload jsonb not null default '{}'::jsonb,
  status public.webhook_event_status not null default 'received',
  error_message text,
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists webhook_events_restaurant_created_idx
  on public.webhook_events (restaurant_id, created_at desc);

alter table public.webhook_events enable row level security;

drop policy if exists webhook_events_management_select on public.webhook_events;
create policy webhook_events_management_select on public.webhook_events
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

revoke all on table public.webhook_events from anon, authenticated;
grant select on table public.webhook_events to authenticated;

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.email_status not null default 'queued',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_outbox_status_created_idx on public.email_outbox (status, created_at);

alter table public.email_outbox enable row level security;

drop policy if exists email_outbox_management_select on public.email_outbox;
create policy email_outbox_management_select on public.email_outbox
for select to authenticated
using (
  restaurant_id is not null
  and private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[])
);

revoke all on table public.email_outbox from anon, authenticated;
grant select on table public.email_outbox to authenticated;

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  polygon jsonb,
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  min_order_amount numeric(12, 2) not null default 0 check (min_order_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists delivery_zones_set_updated_at on public.delivery_zones;
create trigger delivery_zones_set_updated_at
before update on public.delivery_zones
for each row execute function private.set_updated_at();

alter table public.delivery_zones enable row level security;

drop policy if exists delivery_zones_member_select on public.delivery_zones;
create policy delivery_zones_member_select on public.delivery_zones
for select to authenticated
using (private.is_restaurant_member(restaurant_id));

drop policy if exists delivery_zones_management_insert on public.delivery_zones;
create policy delivery_zones_management_insert on public.delivery_zones
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

drop policy if exists delivery_zones_management_update on public.delivery_zones;
create policy delivery_zones_management_update on public.delivery_zones
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

drop policy if exists delivery_zones_management_delete on public.delivery_zones;
create policy delivery_zones_management_delete on public.delivery_zones
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner','manager']::public.member_role[]));

revoke all on table public.delivery_zones from anon, authenticated;
grant select, insert, update, delete on table public.delivery_zones to authenticated;

grant usage on type
  public.order_channel,
  public.channel_integration_status,
  public.webhook_event_status,
  public.email_status
to authenticated;

grant usage on type public.order_type, public.payment_method to anon, authenticated;

-- Halka açık menü: tüketici yüzeyi için tek çağrılık menü çıktısı.
create or replace function public.get_public_menu(restaurant_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', restaurant.id,
      'name', restaurant.name,
      'slug', restaurant.slug,
      'logo_url', restaurant.logo_url,
      'address', restaurant.address,
      'phone', restaurant.phone,
      'currency', restaurant.currency,
      'tax_rate', restaurant.tax_rate,
      'service_modes', to_jsonb(restaurant.service_modes)
    ),
    'delivery_zones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', zone.id,
        'name', zone.name,
        'delivery_fee', zone.delivery_fee,
        'min_order_amount', zone.min_order_amount
      ) order by zone.name)
      from public.delivery_zones zone
      where zone.restaurant_id = restaurant.id and zone.is_active
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', category.id,
        'name', category.name,
        'description', category.description,
        'sort_order', category.sort_order,
        'products', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', product.id,
            'name', product.name,
            'description', product.description,
            'price', product.price,
            'discount_percent', product.discount_percent,
            'image_url', product.image_url,
            'kind', product.kind
          ) order by product.name)
          from public.products product
          where product.category_id = category.id
            and product.restaurant_id = restaurant.id
            and product.is_available = true
        ), '[]'::jsonb)
      ) order by category.sort_order, category.name)
      from public.categories category
      where category.restaurant_id = restaurant.id and category.is_active = true
    ), '[]'::jsonb)
  )
  from public.restaurants restaurant
  where restaurant.slug = restaurant_slug
    and restaurant.onboarding_completed_at is not null;
$$;

revoke all on function public.get_public_menu(text) from public;
grant execute on function public.get_public_menu(text) to anon, authenticated;

-- Misafir siparişi: tüketici web/mobil yüzeyinden, fiyatlar her zaman sunucudan.
create or replace function public.place_public_order(
  restaurant_slug text,
  order_kind public.order_type,
  order_items jsonb,
  customer_name text,
  customer_phone text,
  delivery_address jsonb default null,
  order_notes text default null,
  requested_payment_method public.payment_method default 'cash',
  customer_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  restaurant_row public.restaurants%rowtype;
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
  normalized_name text := trim(coalesce(customer_name, ''));
  normalized_phone text := regexp_replace(coalesce(customer_phone, ''), '[^0-9+]', '', 'g');
  normalized_email text := nullif(lower(trim(coalesce(customer_email, ''))), '');
  delivery_customer_lat numeric(9, 6);
  delivery_customer_lng numeric(9, 6);
  delivery_tracking_token uuid;
begin
  select * into restaurant_row
  from public.restaurants restaurant
  where restaurant.slug = restaurant_slug
    and restaurant.onboarding_completed_at is not null;

  if not found then
    raise exception 'Restaurant is not available for online orders';
  end if;

  if order_kind not in ('delivery', 'takeaway') then
    raise exception 'Online orders support delivery or takeaway only';
  end if;

  if not (order_kind = any(restaurant_row.service_modes)) then
    raise exception 'This restaurant does not accept this order type';
  end if;

  if not exists (
    select 1
    from public.restaurant_subscriptions subscription
    where subscription.restaurant_id = restaurant_row.id
      and subscription.status in ('trialing', 'active')
      and coalesce(
        case when subscription.status = 'trialing' then subscription.trial_ends_at else subscription.current_period_end end,
        now() + interval '1 day'
      ) > now()
  ) then
    raise exception 'Restaurant is not available for online orders';
  end if;

  if char_length(normalized_name) < 2 or char_length(normalized_name) > 120 then
    raise exception 'A valid customer name is required';
  end if;

  if char_length(normalized_phone) < 10 or char_length(normalized_phone) > 20 then
    raise exception 'A valid phone number is required';
  end if;

  if normalized_email is not null
    and normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid email address is required';
  end if;

  if requested_payment_method not in ('cash', 'card') then
    raise exception 'Online payment is not yet available';
  end if;

  if (
    select count(*)
    from public.orders existing_order
    where existing_order.restaurant_id = restaurant_row.id
      and existing_order.channel in ('web', 'mobile')
      and existing_order.customer_phone = normalized_phone
      and existing_order.created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many recent orders from this phone number';
  end if;

  if jsonb_typeof(order_items) <> 'array'
    or jsonb_array_length(order_items) = 0
    or jsonb_array_length(order_items) > 100 then
    raise exception 'Order must contain between 1 and 100 items';
  end if;

  if order_kind = 'delivery' then
    if delivery_address is null or jsonb_typeof(delivery_address) <> 'object' then
      raise exception 'A delivery address is required for delivery orders';
    end if;

    if delivery_address #>> '{location,lat}' is not null then
      begin
        delivery_customer_lat := (delivery_address #>> '{location,lat}')::numeric;
        delivery_customer_lng := (delivery_address #>> '{location,lng}')::numeric;
      exception when others then
        raise exception 'Delivery coordinates are invalid';
      end;

      if delivery_customer_lat not between -90 and 90
        or delivery_customer_lng not between -180 and 180 then
        raise exception 'Delivery coordinates are outside the valid range';
      end if;
    end if;
  end if;

  insert into public.orders (
    id,
    restaurant_id,
    type,
    channel,
    requested_payment_method,
    customer_name,
    customer_phone,
    notes,
    delivery_address
  )
  values (
    new_order_id,
    restaurant_row.id,
    order_kind,
    'web',
    requested_payment_method,
    normalized_name,
    normalized_phone,
    nullif(trim(coalesce(order_notes, '')), ''),
    case when order_kind = 'delivery' then delivery_address else null end
  );

  for line_item in select value from jsonb_array_elements(order_items)
  loop
    begin
      item_product_id := (line_item ->> 'product_id')::uuid;
      item_quantity := (line_item ->> 'quantity')::numeric;
    exception when others then
      raise exception 'Each order item must contain a valid product_id and quantity';
    end;

    if item_quantity <= 0 or item_quantity > 100 then
      raise exception 'Order item quantity is outside the allowed range';
    end if;

    select product.* into selected_product
    from public.products product
    where product.id = item_product_id
      and product.restaurant_id = restaurant_row.id
      and product.is_available = true
    for share;

    if not found then
      raise exception 'A selected product is unavailable';
    end if;

    item_discount := round(item_quantity * selected_product.price * selected_product.discount_percent / 100, 2);
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
      restaurant_row.id,
      new_order_id,
      selected_product.id,
      selected_product.name,
      item_quantity,
      selected_product.price,
      item_discount,
      nullif(trim(coalesce(line_item ->> 'notes', '')), '')
    );
  end loop;

  calculated_tax := round((calculated_subtotal - calculated_discount) * restaurant_row.tax_rate / 100, 2);
  calculated_total := calculated_subtotal - calculated_discount + calculated_tax;

  update public.orders
  set
    subtotal = calculated_subtotal,
    discount_amount = calculated_discount,
    tax_amount = calculated_tax,
    total_amount = calculated_total
  where id = new_order_id;

  if order_kind = 'delivery' then
    insert into public.deliveries (restaurant_id, order_id, customer_lat, customer_lng)
    values (restaurant_row.id, new_order_id, delivery_customer_lat, delivery_customer_lng)
    returning tracking_token into delivery_tracking_token;
  end if;

  if normalized_email is not null then
    insert into public.email_outbox (restaurant_id, recipient, template, payload)
    values (
      restaurant_row.id,
      normalized_email,
      'order_confirmation',
      jsonb_build_object(
        'order_id', new_order_id,
        'restaurant_name', restaurant_row.name,
        'total_amount', calculated_total,
        'tracking_token', delivery_tracking_token
      )
    );
  end if;

  return jsonb_build_object(
    'order_id', new_order_id,
    'tracking_token', delivery_tracking_token,
    'total_amount', calculated_total
  );
end;
$$;

revoke all on function public.place_public_order(text, public.order_type, jsonb, text, text, jsonb, text, public.payment_method, text) from public;
grant execute on function public.place_public_order(text, public.order_type, jsonb, text, text, jsonb, text, public.payment_method, text) to anon, authenticated;

-- 3. parti kanal siparişi alma: webhook secret doğrulamalı, idempotent, hata kaydı bırakır.
create or replace function public.ingest_external_order(
  integration_id uuid,
  webhook_secret uuid,
  external_order_id text,
  payload jsonb,
  event_type text default 'order.created'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  integration_row public.channel_integrations%rowtype;
  restaurant_row public.restaurants%rowtype;
  existing_order_id uuid;
  new_order_id uuid := gen_random_uuid();
  order_kind public.order_type := 'delivery';
  courier_mode text;
  line_item jsonb;
  selected_product public.products%rowtype;
  resolved_product_id uuid;
  item_name text;
  item_quantity numeric(10, 3);
  item_unit_price numeric(12, 2);
  calculated_subtotal numeric(12, 2) := 0;
  calculated_tax numeric(12, 2) := 0;
  calculated_total numeric(12, 2) := 0;
  payment_is_paid boolean;
  payment_method_value public.payment_method;
  customer_display_name text;
  customer_phone_value text;
  address_value jsonb;
  delivery_customer_lat numeric(9, 6);
  delivery_customer_lng numeric(9, 6);
begin
  select * into integration_row
  from public.channel_integrations integration
  where integration.id = integration_id;

  if not found or integration_row.webhook_secret is distinct from webhook_secret then
    raise exception 'Invalid integration credentials';
  end if;

  if integration_row.status <> 'active' then
    raise exception 'Integration is not active';
  end if;

  if external_order_id is null
    or trim(external_order_id) = ''
    or char_length(external_order_id) > 120 then
    raise exception 'A valid external order id is required';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' or pg_column_size(payload) > 100000 then
    raise exception 'A valid payload object is required';
  end if;

  update public.channel_integrations
  set last_event_at = now()
  where id = integration_id;

  select existing.id into existing_order_id
  from public.orders existing
  where existing.restaurant_id = integration_row.restaurant_id
    and existing.channel = integration_row.provider
    and existing.external_id = external_order_id;

  if found then
    insert into public.webhook_events (
      restaurant_id, integration_id, provider, external_id, event_type, payload, status, order_id
    )
    values (
      integration_row.restaurant_id, integration_id, integration_row.provider,
      external_order_id, event_type, payload, 'duplicate', existing_order_id
    );
    return jsonb_build_object('ok', true, 'duplicate', true, 'order_id', existing_order_id);
  end if;

  begin
    select * into restaurant_row
    from public.restaurants restaurant
    where restaurant.id = integration_row.restaurant_id;

    if payload ->> 'order_type' is not null then
      order_kind := (payload ->> 'order_type')::public.order_type;
      if order_kind = 'dine_in' then
        raise exception 'External channels cannot create dine-in orders';
      end if;
    end if;

    courier_mode := lower(coalesce(payload ->> 'courier', 'platform'));
    if courier_mode not in ('platform', 'restaurant') then
      raise exception 'Courier mode must be platform or restaurant';
    end if;

    if jsonb_typeof(payload -> 'items') <> 'array'
      or jsonb_array_length(payload -> 'items') = 0
      or jsonb_array_length(payload -> 'items') > 100 then
      raise exception 'Payload must contain between 1 and 100 items';
    end if;

    customer_display_name := coalesce(
      nullif(trim(payload #>> '{customer,name}'), ''),
      initcap(integration_row.provider::text) || ' müşterisi'
    );
    customer_phone_value := nullif(regexp_replace(coalesce(payload #>> '{customer,phone}', ''), '[^0-9+]', '', 'g'), '');
    address_value := case
      when jsonb_typeof(payload -> 'delivery_address') = 'object' then payload -> 'delivery_address'
      else null
    end;

    if address_value #>> '{location,lat}' is not null then
      begin
        delivery_customer_lat := (address_value #>> '{location,lat}')::numeric;
        delivery_customer_lng := (address_value #>> '{location,lng}')::numeric;
      exception when others then
        delivery_customer_lat := null;
        delivery_customer_lng := null;
      end;
    end if;

    payment_is_paid := coalesce((payload #>> '{payment,paid}')::boolean, true);
    begin
      payment_method_value := coalesce(payload #>> '{payment,method}', 'online')::public.payment_method;
    exception when others then
      payment_method_value := 'online';
    end;

    insert into public.orders (
      id, restaurant_id, type, channel, external_id, requested_payment_method,
      customer_name, customer_phone, notes, delivery_address
    )
    values (
      new_order_id, integration_row.restaurant_id, order_kind, integration_row.provider,
      external_order_id, payment_method_value, customer_display_name, customer_phone_value,
      nullif(trim(coalesce(payload ->> 'notes', '')), ''), address_value
    );

    for line_item in select value from jsonb_array_elements(payload -> 'items')
    loop
      begin
        item_quantity := (line_item ->> 'quantity')::numeric;
      exception when others then
        raise exception 'Each item must contain a valid quantity';
      end;

      if item_quantity is null or item_quantity <= 0 or item_quantity > 1000 then
        raise exception 'Item quantity is outside the allowed range';
      end if;

      resolved_product_id := null;
      selected_product := null;

      if line_item ->> 'product_id' is not null then
        begin
          resolved_product_id := (line_item ->> 'product_id')::uuid;
        exception when others then
          resolved_product_id := null;
        end;
      end if;

      if resolved_product_id is not null then
        select product.* into selected_product
        from public.products product
        where product.id = resolved_product_id
          and product.restaurant_id = integration_row.restaurant_id;
        if not found then
          selected_product := null;
        end if;
      end if;

      if selected_product.id is null and nullif(trim(coalesce(line_item ->> 'sku', '')), '') is not null then
        select product.* into selected_product
        from public.products product
        where product.restaurant_id = integration_row.restaurant_id
          and product.sku = trim(line_item ->> 'sku')
        limit 1;
      end if;

      if selected_product.id is null and nullif(trim(coalesce(line_item ->> 'name', '')), '') is not null then
        select product.* into selected_product
        from public.products product
        where product.restaurant_id = integration_row.restaurant_id
          and lower(product.name) = lower(trim(line_item ->> 'name'))
        limit 1;
      end if;

      item_name := coalesce(
        nullif(trim(coalesce(line_item ->> 'name', '')), ''),
        selected_product.name
      );
      if item_name is null then
        raise exception 'Each item must contain a product reference or name';
      end if;

      begin
        item_unit_price := coalesce((line_item ->> 'unit_price')::numeric, selected_product.price);
      exception when others then
        item_unit_price := selected_product.price;
      end;

      if item_unit_price is null or item_unit_price < 0 or item_unit_price > 100000 then
        raise exception 'Item unit price is outside the allowed range';
      end if;

      calculated_subtotal := calculated_subtotal + round(item_quantity * item_unit_price, 2);

      insert into public.order_items (
        restaurant_id, order_id, product_id, product_name, quantity, unit_price, discount_amount, notes
      )
      values (
        integration_row.restaurant_id, new_order_id, selected_product.id, item_name,
        item_quantity, item_unit_price, 0, nullif(trim(coalesce(line_item ->> 'notes', '')), '')
      );
    end loop;

    calculated_tax := round(calculated_subtotal * restaurant_row.tax_rate / 100, 2);
    calculated_total := calculated_subtotal + calculated_tax;

    update public.orders
    set
      subtotal = calculated_subtotal,
      tax_amount = calculated_tax,
      total_amount = calculated_total,
      payment_status = case when payment_is_paid then 'paid'::public.payment_status else 'pending'::public.payment_status end
    where id = new_order_id;

    if payment_is_paid and calculated_total > 0 then
      insert into public.payments (restaurant_id, order_id, amount, method, status, reference)
      values (
        integration_row.restaurant_id, new_order_id, calculated_total,
        payment_method_value, 'paid', integration_row.provider::text || ':' || external_order_id
      );
    end if;

    if order_kind = 'delivery' and courier_mode = 'restaurant' then
      insert into public.deliveries (restaurant_id, order_id, customer_lat, customer_lng)
      values (integration_row.restaurant_id, new_order_id, delivery_customer_lat, delivery_customer_lng);
    end if;

    insert into public.webhook_events (
      restaurant_id, integration_id, provider, external_id, event_type, payload, status, order_id
    )
    values (
      integration_row.restaurant_id, integration_id, integration_row.provider,
      external_order_id, event_type, payload, 'processed', new_order_id
    );

    update public.channel_integrations
    set error_message = null
    where id = integration_id;

    return jsonb_build_object('ok', true, 'order_id', new_order_id);
  exception when others then
    insert into public.webhook_events (
      restaurant_id, integration_id, provider, external_id, event_type, payload, status, error_message
    )
    values (
      integration_row.restaurant_id, integration_id, integration_row.provider,
      external_order_id, event_type, payload, 'failed', sqlerrm
    );

    update public.channel_integrations
    set error_message = sqlerrm
    where id = integration_id;

    return jsonb_build_object('ok', false, 'error', sqlerrm);
  end;
end;
$$;

revoke all on function public.ingest_external_order(uuid, uuid, text, jsonb, text) from public;
grant execute on function public.ingest_external_order(uuid, uuid, text, jsonb, text) to anon, authenticated;

commit;
