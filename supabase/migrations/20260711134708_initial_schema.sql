create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.member_role as enum (
  'owner',
  'manager',
  'cashier',
  'waiter',
  'kitchen',
  'courier'
);

create type public.member_status as enum ('invited', 'active', 'suspended');
create type public.product_kind as enum ('meat', 'vegetarian', 'other');
create type public.table_status as enum ('available', 'occupied', 'reserved');
create type public.order_type as enum ('dine_in', 'takeaway', 'delivery');
create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'partially_paid', 'paid', 'refunded', 'failed');
create type public.payment_method as enum ('cash', 'card', 'online');
create type public.reservation_status as enum ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
create type public.stock_movement_type as enum ('purchase', 'sale', 'adjustment', 'waste', 'return');
create type public.delivery_status as enum ('pending', 'assigned', 'en_route', 'delivered', 'cancelled');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address text,
  phone text,
  email text,
  logo_url text,
  currency char(3) not null default 'TRY',
  timezone text not null default 'Europe/Istanbul',
  tax_rate numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, created_by)
);

create table public.restaurant_members (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  status public.member_status not null default 'active',
  invited_by uuid references auth.users (id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

create table public.restaurant_invitations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role public.member_role not null check (role <> 'owner'),
  display_name text,
  phone text,
  vehicle_type text check (vehicle_type is null or vehicle_type in ('motorcycle', 'car', 'bicycle')),
  vehicle_plate text,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (accepted_at is null or accepted_by is not null),
  unique (restaurant_id, id)
);

create unique index restaurant_invitations_pending_email_key
on public.restaurant_invitations (restaurant_id, email)
where accepted_at is null and revoked_at is null;

create table public.courier_profiles (
  restaurant_id uuid not null,
  user_id uuid not null,
  display_name text,
  phone text,
  vehicle_type text not null default 'motorcycle'
    check (vehicle_type in ('motorcycle', 'car', 'bicycle')),
  vehicle_plate text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (restaurant_id, user_id),
  foreign key (restaurant_id, user_id)
    references public.restaurant_members (restaurant_id, user_id)
    on delete cascade
);

create table public.subscription_plans (
  id text primary key,
  name text not null,
  description text,
  price_monthly numeric(12, 2) not null default 0 check (price_monthly >= 0),
  price_yearly numeric(12, 2) not null default 0 check (price_yearly >= 0),
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.restaurant_subscriptions (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  plan_id text not null references public.subscription_plans (id),
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create unique index categories_restaurant_name_key on public.categories (restaurant_id, lower(name));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid,
  sku text,
  name text not null check (char_length(trim(name)) between 1 and 140),
  description text,
  price numeric(12, 2) not null check (price >= 0),
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  image_url text,
  kind public.product_kind not null default 'other',
  discount_percent numeric(5, 2) not null default 0 check (discount_percent between 0 and 100),
  is_available boolean not null default true,
  track_inventory boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, sku),
  foreign key (restaurant_id, category_id)
    references public.categories (restaurant_id, id)
    on delete set null (category_id)
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  number text not null check (char_length(trim(number)) between 1 and 24),
  capacity integer not null check (capacity > 0),
  status public.table_status not null default 'available',
  section text,
  position_x numeric(10, 2),
  position_y numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, number)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid,
  type public.order_type not null default 'dine_in',
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  requested_payment_method public.payment_method,
  customer_name text,
  customer_phone text,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  notes text,
  delivery_address jsonb,
  created_by uuid references auth.users (id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  foreign key (restaurant_id, table_id)
    references public.restaurant_tables (restaurant_id, id)
    on delete set null (table_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_id uuid not null,
  product_id uuid,
  product_name text not null,
  quantity numeric(10, 3) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12, 2) generated always as ((quantity * unit_price) - discount_amount) stored,
  notes text,
  created_at timestamptz not null default now(),
  unique (restaurant_id, id),
  foreign key (restaurant_id, order_id)
    references public.orders (restaurant_id, id)
    on delete cascade,
  foreign key (restaurant_id, product_id)
    references public.products (restaurant_id, id)
    on delete set null (product_id),
  check (discount_amount <= quantity * unit_price)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_method not null,
  status public.payment_status not null default 'paid',
  reference text,
  processed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (restaurant_id, id),
  foreign key (restaurant_id, order_id)
    references public.orders (restaurant_id, id)
    on delete restrict
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  party_size integer not null check (party_size > 0),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.reservation_status not null default 'pending',
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  foreign key (restaurant_id, table_id)
    references public.restaurant_tables (restaurant_id, id)
    on delete set null (table_id),
  check (ends_at is null or ends_at > starts_at)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  product_id uuid not null,
  supplier_id uuid,
  current_stock numeric(14, 3) not null default 0,
  min_stock numeric(14, 3) not null default 0 check (min_stock >= 0),
  max_stock numeric(14, 3) check (max_stock is null or max_stock >= min_stock),
  unit text not null default 'adet',
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, product_id),
  foreign key (restaurant_id, product_id)
    references public.products (restaurant_id, id)
    on delete cascade,
  foreign key (restaurant_id, supplier_id)
    references public.suppliers (restaurant_id, id)
    on delete set null (supplier_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  inventory_item_id uuid not null,
  order_id uuid,
  type public.stock_movement_type not null,
  quantity numeric(14, 3) not null check (quantity <> 0),
  unit_cost numeric(12, 2) check (unit_cost is null or unit_cost >= 0),
  reason text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (restaurant_id, inventory_item_id)
    references public.inventory_items (restaurant_id, id)
    on delete cascade,
  foreign key (restaurant_id, order_id)
    references public.orders (restaurant_id, id)
    on delete set null (order_id)
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  order_id uuid not null,
  courier_user_id uuid references auth.users (id) on delete set null,
  status public.delivery_status not null default 'pending',
  tracking_token uuid not null unique default gen_random_uuid(),
  tracking_enabled boolean not null default true,
  estimated_delivery_at timestamptz,
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  courier_lat numeric(9, 6),
  courier_lng numeric(9, 6),
  customer_lat numeric(9, 6),
  customer_lng numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, id),
  unique (restaurant_id, order_id),
  foreign key (restaurant_id, order_id)
    references public.orders (restaurant_id, id)
    on delete cascade
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  related_order_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (restaurant_id, user_id)
    references public.restaurant_members (restaurant_id, user_id)
    on delete cascade,
  foreign key (restaurant_id, related_order_id)
    references public.orders (restaurant_id, id)
    on delete set null (related_order_id)
);

create index restaurant_members_user_idx on public.restaurant_members (user_id, status);
create index restaurant_invitations_restaurant_idx
on public.restaurant_invitations (restaurant_id, created_at desc);
create index courier_profiles_active_idx on public.courier_profiles (restaurant_id, is_active);
create index products_restaurant_category_idx on public.products (restaurant_id, category_id, is_available);
create index restaurant_tables_status_idx on public.restaurant_tables (restaurant_id, status);
create index orders_restaurant_created_idx on public.orders (restaurant_id, created_at desc);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status, created_at desc);
create index order_items_order_idx on public.order_items (restaurant_id, order_id);
create index payments_order_idx on public.payments (restaurant_id, order_id);
create index reservations_start_idx on public.reservations (restaurant_id, starts_at, status);
create index inventory_low_stock_idx on public.inventory_items (restaurant_id, current_stock, min_stock);
create index stock_movements_item_idx on public.stock_movements (restaurant_id, inventory_item_id, created_at desc);
create index deliveries_courier_idx on public.deliveries (restaurant_id, courier_user_id, status);
create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger restaurants_set_updated_at before update on public.restaurants
for each row execute function private.set_updated_at();
create trigger restaurant_members_set_updated_at before update on public.restaurant_members
for each row execute function private.set_updated_at();
create trigger restaurant_invitations_set_updated_at before update on public.restaurant_invitations
for each row execute function private.set_updated_at();
create trigger courier_profiles_set_updated_at before update on public.courier_profiles
for each row execute function private.set_updated_at();
create trigger subscription_plans_set_updated_at before update on public.subscription_plans
for each row execute function private.set_updated_at();
create trigger restaurant_subscriptions_set_updated_at before update on public.restaurant_subscriptions
for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger restaurant_tables_set_updated_at before update on public.restaurant_tables
for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function private.set_updated_at();
create trigger reservations_set_updated_at before update on public.reservations
for each row execute function private.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function private.set_updated_at();
create trigger inventory_items_set_updated_at before update on public.inventory_items
for each row execute function private.set_updated_at();
create trigger deliveries_set_updated_at before update on public.deliveries
for each row execute function private.set_updated_at();

create or replace function private.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = target_restaurant_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'::public.member_status
  );
$$;

create or replace function private.has_restaurant_role(
  target_restaurant_id uuid,
  allowed_roles public.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_members member
    where member.restaurant_id = target_restaurant_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'::public.member_status
      and member.role = any (allowed_roles)
  );
$$;

create or replace function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user_id = (select auth.uid()) or exists (
    select 1
    from public.restaurant_members mine
    join public.restaurant_members theirs
      on theirs.restaurant_id = mine.restaurant_id
    where mine.user_id = (select auth.uid())
      and mine.status = 'active'::public.member_status
      and theirs.user_id = target_user_id
      and theirs.status = 'active'::public.member_status
      and (
        mine.role in ('owner', 'manager')
        or (mine.role = 'cashier' and theirs.role = 'courier')
      )
  );
$$;

create or replace function private.can_read_order(
  target_restaurant_id uuid,
  target_order_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_restaurant_role(
    target_restaurant_id,
    array['owner', 'manager', 'cashier', 'waiter', 'kitchen']::public.member_role[]
  ) or exists (
    select 1
    from public.restaurant_members member
    join public.deliveries delivery
      on delivery.restaurant_id = member.restaurant_id
     and delivery.courier_user_id = member.user_id
    where member.restaurant_id = target_restaurant_id
      and member.user_id = (select auth.uid())
      and member.role = 'courier'
      and member.status = 'active'::public.member_status
      and delivery.order_id = target_order_id
  );
$$;

revoke all on function private.is_restaurant_member(uuid) from public;
revoke all on function private.has_restaurant_role(uuid, public.member_role[]) from public;
revoke all on function private.can_view_profile(uuid) from public;
revoke all on function private.can_read_order(uuid, uuid) from public;
grant execute on function private.is_restaurant_member(uuid) to authenticated;
grant execute on function private.has_restaurant_role(uuid, public.member_role[]) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;
grant execute on function private.can_read_order(uuid, uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = lower(new.email)
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_auth_user_email_change() from public;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.handle_auth_user_email_change();

insert into public.profiles (id, email, full_name, phone, avatar_url)
select
  user_record.id,
  lower(user_record.email),
  coalesce(user_record.raw_user_meta_data ->> 'full_name', ''),
  user_record.raw_user_meta_data ->> 'phone',
  user_record.raw_user_meta_data ->> 'avatar_url'
from auth.users user_record
on conflict (id) do update set email = excluded.email;

create or replace function public.create_restaurant(
  restaurant_name text,
  restaurant_address text default null,
  restaurant_phone text default null,
  restaurant_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_restaurant_id uuid := gen_random_uuid();
  slug_base text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(restaurant_name)) < 2 then
    raise exception 'Restaurant name is too short';
  end if;

  slug_base := trim(both '-' from regexp_replace(lower(restaurant_name), '[^a-z0-9]+', '-', 'g'));
  if slug_base = '' then
    slug_base := 'restaurant';
  end if;

  insert into public.profiles (id, email, full_name)
  select
    user_record.id,
    lower(user_record.email),
    coalesce(user_record.raw_user_meta_data ->> 'full_name', '')
  from auth.users user_record
  where user_record.id = current_user_id
  on conflict (id) do nothing;

  insert into public.restaurants (id, name, slug, address, phone, email, created_by)
  values (
    new_restaurant_id,
    trim(restaurant_name),
    slug_base || '-' || substr(new_restaurant_id::text, 1, 8),
    nullif(trim(restaurant_address), ''),
    nullif(trim(restaurant_phone), ''),
    nullif(trim(restaurant_email), ''),
    current_user_id
  );

  insert into public.restaurant_members (restaurant_id, user_id, role, status, joined_at)
  values (new_restaurant_id, current_user_id, 'owner', 'active', now());

  insert into public.restaurant_subscriptions (
    restaurant_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  values (
    new_restaurant_id,
    'basic',
    'trialing',
    now() + interval '14 days',
    now(),
    now() + interval '14 days'
  );

  return new_restaurant_id;
end;
$$;

revoke all on function public.create_restaurant(text, text, text, text) from public;
grant execute on function public.create_restaurant(text, text, text, text) to authenticated;

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
  current_role public.member_role;
  normalized_email text := lower(trim(invite_email));
  invitation_token uuid;
begin
  select member.role
  into current_role
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.user_id = current_user_id
    and member.status = 'active';

  if current_role not in ('owner', 'manager') then
    raise exception 'Not authorized to invite restaurant members';
  end if;

  if invite_role = 'owner' or (current_role = 'manager' and invite_role = 'manager') then
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

revoke all on function public.create_restaurant_invitation(uuid, text, public.member_role) from public;
grant execute on function public.create_restaurant_invitation(uuid, text, public.member_role) to authenticated;

create or replace function public.create_courier_invitation(
  target_restaurant_id uuid,
  invite_email text,
  courier_name text,
  courier_phone text,
  courier_vehicle_type text,
  courier_vehicle_plate text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_token uuid;
begin
  if courier_vehicle_type not in ('motorcycle', 'car', 'bicycle') then
    raise exception 'Invalid courier vehicle type';
  end if;

  invitation_token := public.create_restaurant_invitation(
    target_restaurant_id,
    invite_email,
    'courier'
  );

  update public.restaurant_invitations
  set
    display_name = nullif(trim(courier_name), ''),
    phone = nullif(trim(courier_phone), ''),
    vehicle_type = courier_vehicle_type,
    vehicle_plate = nullif(trim(courier_vehicle_plate), '')
  where token = invitation_token;

  return invitation_token;
end;
$$;

revoke all on function public.create_courier_invitation(uuid, text, text, text, text, text) from public;
grant execute on function public.create_courier_invitation(uuid, text, text, text, text, text) to authenticated;

create or replace function public.get_restaurant_invitation(invitation_token uuid)
returns table (
  restaurant_name text,
  email text,
  role public.member_role,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    restaurant.name,
    invitation.email,
    invitation.role,
    invitation.expires_at
  from public.restaurant_invitations invitation
  join public.restaurants restaurant on restaurant.id = invitation.restaurant_id
  where invitation.token = invitation_token
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now();
$$;

revoke all on function public.get_restaurant_invitation(uuid) from public;
grant execute on function public.get_restaurant_invitation(uuid) to anon, authenticated;

create or replace function public.accept_restaurant_invitation(invitation_token uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email text;
  target_invitation public.restaurant_invitations%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select lower(user_record.email)
  into current_email
  from auth.users user_record
  where user_record.id = current_user_id;

  select invitation.*
  into target_invitation
  from public.restaurant_invitations invitation
  where invitation.token = invitation_token
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now()
  for update;

  if not found then
    raise exception 'Invitation is invalid or expired';
  end if;

  if current_email is null or current_email <> target_invitation.email then
    raise exception 'Invitation email does not match the authenticated user';
  end if;

  insert into public.restaurant_members (
    restaurant_id,
    user_id,
    role,
    status,
    invited_by,
    joined_at
  )
  values (
    target_invitation.restaurant_id,
    current_user_id,
    target_invitation.role,
    'active',
    target_invitation.invited_by,
    now()
  )
  on conflict (restaurant_id, user_id) do update set
    role = case
      when public.restaurant_members.role = 'owner' then public.restaurant_members.role
      else excluded.role
    end,
    status = 'active',
    joined_at = coalesce(public.restaurant_members.joined_at, now());

  if target_invitation.role = 'courier' then
    insert into public.courier_profiles (
      restaurant_id,
      user_id,
      display_name,
      phone,
      vehicle_type,
      vehicle_plate
    )
    select
      target_invitation.restaurant_id,
      current_user_id,
      coalesce(target_invitation.display_name, profile.full_name),
      coalesce(target_invitation.phone, profile.phone),
      coalesce(target_invitation.vehicle_type, 'motorcycle'),
      target_invitation.vehicle_plate
    from public.profiles profile
    where profile.id = current_user_id
    on conflict (restaurant_id, user_id) do update set is_active = true;
  end if;

  update public.restaurant_invitations
  set accepted_at = now(), accepted_by = current_user_id
  where id = target_invitation.id;

  return target_invitation.restaurant_id;
end;
$$;

revoke all on function public.accept_restaurant_invitation(uuid) from public;
grant execute on function public.accept_restaurant_invitation(uuid) to authenticated;

create or replace function public.set_restaurant_member_role(
  target_restaurant_id uuid,
  target_user_id uuid,
  next_role public.member_role
)
returns public.member_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_current_role public.member_role;
  owner_count integer;
begin
  if not private.has_restaurant_role(
    target_restaurant_id,
    array['owner']::public.member_role[]
  ) then
    raise exception 'Only restaurant owners can change member roles';
  end if;

  select member.role
  into target_current_role
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.user_id = target_user_id
    and member.status = 'active'
  for update;

  if not found then
    raise exception 'Restaurant member not found';
  end if;

  if target_current_role = 'owner' and next_role <> 'owner' then
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

  update public.restaurant_members
  set role = next_role
  where restaurant_id = target_restaurant_id
    and user_id = target_user_id;

  return next_role;
end;
$$;

revoke all on function public.set_restaurant_member_role(uuid, uuid, public.member_role) from public;
grant execute on function public.set_restaurant_member_role(uuid, uuid, public.member_role) to authenticated;

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
  current_role public.member_role;
  target_role public.member_role;
  owner_count integer;
begin
  select member.role
  into current_role
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

  if current_role = 'manager' and target_role in ('owner', 'manager') then
    raise exception 'Managers cannot remove owners or other managers';
  end if;

  if current_role not in ('owner', 'manager') then
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

revoke all on function public.remove_restaurant_member(uuid, uuid) from public;
grant execute on function public.remove_restaurant_member(uuid, uuid) to authenticated;

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
    payment_status = case when pay_now then 'paid' else 'pending' end
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

revoke all on function public.create_order(uuid, jsonb, public.order_type, uuid, text, text, text, jsonb, public.payment_method, boolean) from public;
grant execute on function public.create_order(uuid, jsonb, public.order_type, uuid, text, text, text, jsonb, public.payment_method, boolean)
to authenticated;

create or replace function public.set_order_status(
  target_order_id uuid,
  next_status public.order_status
)
returns public.order_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
  current_member_role public.member_role;
begin
  select order_record.*
  into target_order
  from public.orders order_record
  where order_record.id = target_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  select member.role
  into current_member_role
  from public.restaurant_members member
  where member.restaurant_id = target_order.restaurant_id
    and member.user_id = (select auth.uid())
    and member.status = 'active';

  if current_member_role is null
    or current_member_role not in ('owner', 'manager', 'cashier', 'waiter', 'kitchen') then
    raise exception 'Not authorized to update this order';
  end if;

  if target_order.status = next_status then
    return next_status;
  end if;

  if current_member_role = 'kitchen' and next_status not in ('preparing', 'ready') then
    raise exception 'Kitchen staff can only prepare or mark orders ready';
  end if;

  if current_member_role = 'waiter' and next_status not in ('completed', 'cancelled') then
    raise exception 'Waiters can only complete or cancel orders';
  end if;

  if not (
    (target_order.status = 'pending' and next_status in ('preparing', 'cancelled'))
    or (target_order.status = 'preparing' and next_status in ('ready', 'cancelled'))
    or (target_order.status = 'ready' and next_status in ('completed', 'cancelled'))
  ) then
    raise exception 'Invalid order status transition from % to %', target_order.status, next_status;
  end if;

  update public.orders
  set
    status = next_status,
    completed_at = case when next_status = 'completed' then now() else completed_at end
  where id = target_order_id;

  if next_status in ('completed', 'cancelled') and target_order.table_id is not null then
    update public.restaurant_tables restaurant_table
    set status = 'available'
    where restaurant_table.id = target_order.table_id
      and restaurant_table.restaurant_id = target_order.restaurant_id
      and not exists (
        select 1
        from public.orders other_order
        where other_order.table_id = target_order.table_id
          and other_order.id <> target_order.id
          and other_order.status not in ('completed', 'cancelled')
      );
  end if;

  return next_status;
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status) from public;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

create or replace function public.record_order_payment(
  target_order_id uuid,
  payment_method public.payment_method,
  payment_amount numeric default null,
  payment_reference text default null
)
returns public.payment_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
  paid_total numeric(12, 2);
  remaining_amount numeric(12, 2);
  accepted_amount numeric(12, 2);
  next_payment_status public.payment_status;
begin
  select order_record.*
  into target_order
  from public.orders order_record
  where order_record.id = target_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if not private.has_restaurant_role(
    target_order.restaurant_id,
    array['owner', 'manager', 'cashier']::public.member_role[]
  ) then
    raise exception 'Not authorized to take payment for this order';
  end if;

  if target_order.status = 'cancelled' then
    raise exception 'Cancelled orders cannot be paid';
  end if;

  select coalesce(sum(payment.amount), 0)
  into paid_total
  from public.payments payment
  where payment.order_id = target_order_id
    and payment.restaurant_id = target_order.restaurant_id
    and payment.status = 'paid';

  remaining_amount := target_order.total_amount - paid_total;
  if remaining_amount <= 0 then
    raise exception 'Order is already paid';
  end if;

  accepted_amount := round(coalesce(payment_amount, remaining_amount), 2);
  if accepted_amount <= 0 or accepted_amount > remaining_amount then
    raise exception 'Payment amount must be positive and cannot exceed the remaining balance';
  end if;

  insert into public.payments (
    restaurant_id,
    order_id,
    amount,
    method,
    status,
    reference,
    processed_by
  )
  values (
    target_order.restaurant_id,
    target_order_id,
    accepted_amount,
    payment_method,
    'paid',
    nullif(trim(payment_reference), ''),
    (select auth.uid())
  );

  next_payment_status := case
    when paid_total + accepted_amount >= target_order.total_amount then 'paid'::public.payment_status
    else 'partially_paid'::public.payment_status
  end;

  update public.orders
  set
    payment_status = next_payment_status,
    requested_payment_method = coalesce(requested_payment_method, payment_method)
  where id = target_order_id;

  return next_payment_status;
end;
$$;

revoke all on function public.record_order_payment(uuid, public.payment_method, numeric, text) from public;
grant execute on function public.record_order_payment(uuid, public.payment_method, numeric, text) to authenticated;

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

  return 'assigned';
end;
$$;

revoke all on function public.assign_delivery_courier(uuid, uuid) from public;
grant execute on function public.assign_delivery_courier(uuid, uuid) to authenticated;

create or replace function public.set_delivery_status(
  target_order_id uuid,
  next_status public.delivery_status,
  current_lat numeric default null,
  current_lng numeric default null
)
returns public.delivery_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_delivery public.deliveries%rowtype;
  current_member_role public.member_role;
begin
  select delivery.*
  into target_delivery
  from public.deliveries delivery
  where delivery.order_id = target_order_id
  for update;

  if not found then
    raise exception 'Delivery not found';
  end if;

  select member.role
  into current_member_role
  from public.restaurant_members member
  where member.restaurant_id = target_delivery.restaurant_id
    and member.user_id = current_user_id
    and member.status = 'active';

  if current_member_role is null
    or current_member_role not in ('owner', 'manager', 'cashier', 'courier') then
    raise exception 'Not authorized to update this delivery';
  end if;

  if current_member_role = 'courier'
    and target_delivery.courier_user_id is distinct from current_user_id then
    raise exception 'Delivery is not assigned to this courier';
  end if;

  if target_delivery.status <> next_status and not (
    (target_delivery.status = 'pending' and next_status in ('assigned', 'en_route', 'cancelled'))
    or (target_delivery.status = 'assigned' and next_status in ('en_route', 'cancelled'))
    or (target_delivery.status = 'en_route' and next_status in ('delivered', 'cancelled'))
  ) then
    raise exception 'Invalid delivery status transition from % to %', target_delivery.status, next_status;
  end if;

  update public.deliveries
  set
    status = next_status,
    courier_user_id = case
      when current_member_role = 'courier' and courier_user_id is null then current_user_id
      else courier_user_id
    end,
    assigned_at = case
      when next_status in ('assigned', 'en_route', 'delivered') then coalesce(assigned_at, now())
      else assigned_at
    end,
    picked_up_at = case
      when next_status in ('en_route', 'delivered') then coalesce(picked_up_at, now())
      else picked_up_at
    end,
    delivered_at = case when next_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
    courier_lat = coalesce(current_lat, courier_lat),
    courier_lng = coalesce(current_lng, courier_lng)
  where id = target_delivery.id;

  if next_status = 'delivered' then
    update public.orders
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = target_order_id
      and restaurant_id = target_delivery.restaurant_id
      and status <> 'cancelled';
  end if;

  return next_status;
end;
$$;

revoke all on function public.set_delivery_status(uuid, public.delivery_status, numeric, numeric) from public;
grant execute on function public.set_delivery_status(uuid, public.delivery_status, numeric, numeric) to authenticated;

create or replace function public.set_inventory_stock(
  target_product_id uuid,
  new_stock numeric,
  change_reason text default 'Manual stock adjustment'
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_inventory public.inventory_items%rowtype;
  stock_delta numeric(14, 3);
begin
  if new_stock < 0 then
    raise exception 'Stock cannot be negative';
  end if;

  select inventory.*
  into target_inventory
  from public.inventory_items inventory
  where inventory.product_id = target_product_id
  for update;

  if not found then
    raise exception 'Inventory item not found';
  end if;

  if not private.has_restaurant_role(
    target_inventory.restaurant_id,
    array['owner', 'manager']::public.member_role[]
  ) then
    raise exception 'Not authorized to update this inventory';
  end if;

  stock_delta := new_stock - target_inventory.current_stock;

  update public.inventory_items
  set current_stock = new_stock
  where id = target_inventory.id;

  if stock_delta <> 0 then
    insert into public.stock_movements (
      restaurant_id,
      inventory_item_id,
      type,
      quantity,
      unit_cost,
      reason,
      created_by
    )
    values (
      target_inventory.restaurant_id,
      target_inventory.id,
      'adjustment',
      stock_delta,
      target_inventory.cost_price,
      nullif(trim(change_reason), ''),
      (select auth.uid())
    );
  end if;

  return new_stock;
end;
$$;

revoke all on function public.set_inventory_stock(uuid, numeric, text) from public;
grant execute on function public.set_inventory_stock(uuid, numeric, text) to authenticated;

create or replace function public.get_delivery_tracking(token uuid)
returns table (
  order_reference text,
  status public.delivery_status,
  estimated_delivery_at timestamptz,
  courier_lat numeric,
  courier_lng numeric,
  customer_lat numeric,
  customer_lng numeric,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    right(delivery.order_id::text, 6),
    delivery.status,
    delivery.estimated_delivery_at,
    delivery.courier_lat,
    delivery.courier_lng,
    delivery.customer_lat,
    delivery.customer_lng,
    delivery.updated_at
  from public.deliveries delivery
  where delivery.tracking_token = token
    and delivery.tracking_enabled = true;
$$;

revoke all on function public.get_delivery_tracking(uuid) from public;
grant execute on function public.get_delivery_tracking(uuid) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_invitations enable row level security;
alter table public.courier_profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.restaurant_subscriptions enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.reservations enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.deliveries enable row level security;
alter table public.notifications enable row level security;

create policy profiles_select_shared_restaurant on public.profiles
for select to authenticated
using (private.can_view_profile(id));

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy restaurants_select_member on public.restaurants
for select to authenticated
using (private.is_restaurant_member(id));

create policy restaurants_update_management on public.restaurants
for update to authenticated
using (private.has_restaurant_role(id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(id, array['owner', 'manager']::public.member_role[]));

create policy members_select_restaurant on public.restaurant_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[])
  or (
    role = 'courier'
    and private.has_restaurant_role(restaurant_id, array['cashier']::public.member_role[])
  )
);

create policy members_insert_owner on public.restaurant_members
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner']::public.member_role[]));

create policy members_update_owner on public.restaurant_members
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner']::public.member_role[]));

create policy members_delete_owner on public.restaurant_members
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner']::public.member_role[]));

create policy invitations_select_management on public.restaurant_invitations
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy courier_profiles_select_member on public.courier_profiles
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier']::public.member_role[])
);
create policy courier_profiles_manage_management on public.courier_profiles
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));
create policy courier_profiles_update_self on public.courier_profiles
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and private.is_restaurant_member(restaurant_id));

create policy subscription_plans_read_active on public.subscription_plans
for select to anon, authenticated
using (is_active = true);

create policy restaurant_subscriptions_select_member on public.restaurant_subscriptions
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy categories_select_member on public.categories
for select to authenticated using (private.is_restaurant_member(restaurant_id));
create policy categories_manage_management on public.categories
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy products_select_member on public.products
for select to authenticated using (private.is_restaurant_member(restaurant_id));
create policy products_manage_management on public.products
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy tables_select_member on public.restaurant_tables
for select to authenticated
using (private.has_restaurant_role(
  restaurant_id,
  array['owner', 'manager', 'cashier', 'waiter', 'kitchen']::public.member_role[]
));
create policy tables_manage_front_of_house on public.restaurant_tables
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));

create policy orders_select_member on public.orders
for select to authenticated using (private.can_read_order(restaurant_id, id));
create policy orders_insert_front_of_house on public.orders
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));
create policy orders_update_staff on public.orders
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter', 'kitchen', 'courier']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter', 'kitchen', 'courier']::public.member_role[]));
create policy orders_delete_management on public.orders
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy order_items_select_member on public.order_items
for select to authenticated using (private.can_read_order(restaurant_id, order_id));
create policy order_items_insert_front_of_house on public.order_items
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));
create policy order_items_update_front_of_house on public.order_items
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));
create policy order_items_delete_front_of_house on public.order_items
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));

create policy payments_select_member on public.payments
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier']::public.member_role[]));
create policy payments_manage_cashier on public.payments
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier']::public.member_role[]));

create policy reservations_select_member on public.reservations
for select to authenticated
using (private.has_restaurant_role(
  restaurant_id,
  array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]
));
create policy reservations_manage_front_of_house on public.reservations
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));

create policy suppliers_select_member on public.suppliers
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));
create policy suppliers_manage_management on public.suppliers
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy inventory_select_member on public.inventory_items
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));
create policy inventory_manage_management on public.inventory_items
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy stock_movements_select_member on public.stock_movements
for select to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));
create policy stock_movements_manage_management on public.stock_movements
for all to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy deliveries_select_member on public.deliveries
for select to authenticated
using (
  private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier']::public.member_role[])
  or courier_user_id = (select auth.uid())
);
create policy deliveries_insert_front_of_house on public.deliveries
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'waiter']::public.member_role[]));
create policy deliveries_update_delivery_staff on public.deliveries
for update to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'courier']::public.member_role[]))
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager', 'cashier', 'courier']::public.member_role[]));
create policy deliveries_delete_management on public.deliveries
for delete to authenticated
using (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications
for delete to authenticated
using (user_id = (select auth.uid()));
create policy notifications_insert_management on public.notifications
for insert to authenticated
with check (private.has_restaurant_role(restaurant_id, array['owner', 'manager']::public.member_role[]));

grant usage on schema public to anon, authenticated;
grant select on public.subscription_plans to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant select on public.restaurants to authenticated;
grant update (name, slug, address, phone, email, logo_url, currency, timezone, tax_rate)
on public.restaurants to authenticated;
grant select on public.restaurant_members to authenticated;
grant select on public.restaurant_invitations to authenticated;
grant select, insert, update, delete on public.courier_profiles to authenticated;
grant select on public.restaurant_subscriptions to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.restaurant_tables to authenticated;
grant select, delete on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.payments to authenticated;
grant select, insert, update, delete on public.reservations to authenticated;
grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, delete on public.inventory_items to authenticated;
grant select on public.stock_movements to authenticated;
grant select on public.deliveries to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;

insert into public.subscription_plans (id, name, description, price_monthly, price_yearly, features)
values
  ('basic', 'Temel', 'Kucuk restoranlar icin temel POS ozellikleri', 199, 1990, array['menu', 'orders', 'tables']),
  ('standard', 'Standart', 'Buyuyen restoranlar icin operasyon ve stok yonetimi', 399, 3990, array['menu', 'orders', 'tables', 'kitchen', 'reports', 'inventory']),
  ('pro', 'Profesyonel', 'Teslimat ve gelismis raporlama dahil tum ozellikler', 699, 6990, array['menu', 'orders', 'tables', 'kitchen', 'reports', 'inventory', 'analytics', 'delivery'])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  features = excluded.features,
  is_active = true;

create view public.daily_sales
with (security_invoker = true)
as
select
  restaurant_id,
  created_at::date as sales_date,
  count(*) filter (where status = 'completed') as completed_orders,
  coalesce(sum(total_amount) filter (where status = 'completed'), 0) as total_revenue,
  coalesce(avg(total_amount) filter (where status = 'completed'), 0) as average_order_value
from public.orders
group by restaurant_id, created_at::date;

grant select on public.daily_sales to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.orders;
    alter publication supabase_realtime add table public.restaurant_tables;
    alter publication supabase_realtime add table public.deliveries;
    alter publication supabase_realtime add table public.notifications;
    alter publication supabase_realtime add table public.restaurant_members;
    alter publication supabase_realtime add table public.courier_profiles;
  end if;
end;
$$;
