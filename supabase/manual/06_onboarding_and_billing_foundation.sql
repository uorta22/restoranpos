begin;

do $$
begin
  create type public.onboarding_step as enum (
    'business',
    'operations',
    'plan',
    'setup',
    'complete'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.billing_cycle as enum ('monthly', 'yearly');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'onboarding_completed_at'
  ) then
    execute 'alter table public.restaurants add column onboarding_completed_at timestamptz';
    execute 'update public.restaurants set onboarding_completed_at = coalesce(created_at, now())';
  end if;
end;
$$;

alter table public.restaurants
  add column if not exists service_modes public.order_type[] not null
    default array['dine_in', 'takeaway', 'delivery']::public.order_type[];

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_service_modes_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
      add constraint restaurants_service_modes_check
      check (
        cardinality(service_modes) between 1 and 3
        and service_modes <@ array['dine_in', 'takeaway', 'delivery']::public.order_type[]
      );
  end if;
end;
$$;

alter table public.subscription_plans
  add column if not exists trial_enabled boolean not null default true,
  add column if not exists trial_days integer not null default 14;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscription_plans_trial_days_check'
      and conrelid = 'public.subscription_plans'::regclass
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_trial_days_check
      check (trial_days between 0 and 90);
  end if;
end;
$$;

alter table public.restaurant_subscriptions
  add column if not exists billing_cycle public.billing_cycle not null default 'monthly',
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists grace_ends_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists cancelled_at timestamptz;

create table if not exists public.onboarding_sessions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  restaurant_id uuid unique references public.restaurants (id) on delete cascade,
  current_step public.onboarding_step not null default 'business',
  selected_plan_id text not null default 'standard' references public.subscription_plans (id),
  billing_cycle public.billing_cycle not null default 'monthly',
  acquisition_source text check (
    acquisition_source is null
    or (
      char_length(acquisition_source) between 1 and 80
      and acquisition_source ~ '^[a-zA-Z0-9._-]+$'
    )
  ),
  table_count integer not null default 0 check (table_count between 0 and 200),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (current_step = 'complete' and completed_at is not null)
    or (current_step <> 'complete' and completed_at is null)
  )
);

drop trigger if exists onboarding_sessions_set_updated_at on public.onboarding_sessions;
create trigger onboarding_sessions_set_updated_at
before update on public.onboarding_sessions
for each row execute function private.set_updated_at();

alter table public.onboarding_sessions enable row level security;

drop policy if exists onboarding_sessions_select_own on public.onboarding_sessions;
create policy onboarding_sessions_select_own on public.onboarding_sessions
for select to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.onboarding_sessions from anon, authenticated;
grant select on table public.onboarding_sessions to authenticated;
grant usage on type public.onboarding_step, public.billing_cycle to authenticated;

update public.subscription_plans
set
  features = case
    when features @> array['reservations']::text[] then features
    else array_append(features, 'reservations')
  end,
  trial_enabled = true,
  trial_days = 14
where id in ('basic', 'standard', 'pro');

create or replace function public.start_onboarding(
  requested_plan_id text default 'standard',
  requested_billing_cycle public.billing_cycle default 'monthly',
  acquisition_source text default null
)
returns public.onboarding_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_plan_id text := lower(trim(coalesce(requested_plan_id, 'standard')));
  normalized_source text;
  existing_restaurant_id uuid;
  existing_role public.member_role;
  existing_completed_at timestamptz;
  session_row public.onboarding_sessions%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.subscription_plans plan
    where plan.id = normalized_plan_id
      and plan.is_active = true
      and plan.trial_enabled = true
  ) then
    raise exception 'Selected plan is not available for onboarding';
  end if;

  normalized_source := nullif(
    trim(both '-' from regexp_replace(trim(coalesce(acquisition_source, '')), '[^a-zA-Z0-9._-]+', '-', 'g')),
    ''
  );
  normalized_source := left(normalized_source, 80);

  select
    member.restaurant_id,
    member.role,
    restaurant.onboarding_completed_at
  into existing_restaurant_id, existing_role, existing_completed_at
  from public.restaurant_members member
  join public.restaurants restaurant on restaurant.id = member.restaurant_id
  where member.user_id = current_user_id
    and member.status = 'active'
  order by member.created_at asc
  limit 1;

  if existing_restaurant_id is not null and existing_role <> 'owner' then
    raise exception 'Only restaurant owners can run onboarding';
  end if;

  insert into public.onboarding_sessions as current_session (
    user_id,
    restaurant_id,
    current_step,
    selected_plan_id,
    billing_cycle,
    acquisition_source,
    completed_at
  )
  values (
    current_user_id,
    existing_restaurant_id,
    case
      when existing_completed_at is not null then 'complete'::public.onboarding_step
      when existing_restaurant_id is not null then 'operations'::public.onboarding_step
      else 'business'::public.onboarding_step
    end,
    normalized_plan_id,
    coalesce(requested_billing_cycle, 'monthly'::public.billing_cycle),
    normalized_source,
    existing_completed_at
  )
  on conflict (user_id) do update set
    restaurant_id = coalesce(current_session.restaurant_id, excluded.restaurant_id),
    current_step = case
      when excluded.completed_at is not null then 'complete'::public.onboarding_step
      when current_session.current_step = 'business'
        and current_session.restaurant_id is null
        and excluded.restaurant_id is not null
        then excluded.current_step
      else current_session.current_step
    end,
    selected_plan_id = case
      when current_session.completed_at is null
        and current_session.current_step = 'business'
        and current_session.restaurant_id is null
        then excluded.selected_plan_id
      else current_session.selected_plan_id
    end,
    billing_cycle = case
      when current_session.completed_at is null
        and current_session.current_step = 'business'
        and current_session.restaurant_id is null
        then excluded.billing_cycle
      else current_session.billing_cycle
    end,
    acquisition_source = coalesce(current_session.acquisition_source, excluded.acquisition_source),
    completed_at = coalesce(current_session.completed_at, excluded.completed_at)
  returning * into session_row;

  return session_row;
end;
$$;

create or replace function public.create_restaurant_from_onboarding(
  restaurant_name text,
  restaurant_address text default null,
  restaurant_phone text default null,
  restaurant_email text default null,
  restaurant_timezone text default 'Europe/Istanbul',
  restaurant_currency text default 'TRY'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  session_row public.onboarding_sessions%rowtype;
  existing_restaurant_id uuid;
  existing_role public.member_role;
  new_restaurant_id uuid := gen_random_uuid();
  slug_base text;
  normalized_timezone text := trim(coalesce(restaurant_timezone, 'Europe/Istanbul'));
  normalized_currency text := upper(trim(coalesce(restaurant_currency, 'TRY')));
  plan_trial_enabled boolean;
  plan_trial_days integer;
  trial_started_at timestamptz := now();
  trial_ends_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(trim(coalesce(restaurant_name, ''))) < 2 then
    raise exception 'Restaurant name is too short';
  end if;

  if restaurant_email is not null
    and trim(restaurant_email) <> ''
    and lower(trim(restaurant_email)) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    raise exception 'A valid restaurant email is required';
  end if;

  if normalized_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a three-letter ISO code';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names timezone_entry
    where timezone_entry.name = normalized_timezone
  ) then
    raise exception 'Timezone is not supported';
  end if;

  select *
  into session_row
  from public.onboarding_sessions session
  where session.user_id = current_user_id
  for update;

  if not found then
    select *
    into session_row
    from public.start_onboarding('standard', 'monthly', null);
  end if;

  select member.restaurant_id, member.role
  into existing_restaurant_id, existing_role
  from public.restaurant_members member
  where member.user_id = current_user_id
    and member.status = 'active'
  order by member.created_at asc
  limit 1;

  if existing_restaurant_id is not null then
    if existing_role <> 'owner' then
      raise exception 'Only restaurant owners can run onboarding';
    end if;

    update public.onboarding_sessions
    set
      restaurant_id = existing_restaurant_id,
      current_step = case
        when current_step = 'business' then 'operations'::public.onboarding_step
        else current_step
      end
    where user_id = current_user_id;

    return existing_restaurant_id;
  end if;

  select plan.trial_enabled, plan.trial_days
  into plan_trial_enabled, plan_trial_days
  from public.subscription_plans plan
  where plan.id = session_row.selected_plan_id
    and plan.is_active = true;

  if not found or not plan_trial_enabled then
    raise exception 'Selected plan is not available for onboarding';
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

  insert into public.restaurants (
    id,
    name,
    slug,
    address,
    phone,
    email,
    currency,
    timezone,
    created_by
  )
  values (
    new_restaurant_id,
    trim(restaurant_name),
    slug_base || '-' || substr(new_restaurant_id::text, 1, 8),
    nullif(trim(restaurant_address), ''),
    nullif(trim(restaurant_phone), ''),
    nullif(lower(trim(restaurant_email)), ''),
    normalized_currency,
    normalized_timezone,
    current_user_id
  );

  insert into public.restaurant_members (restaurant_id, user_id, role, status, joined_at)
  values (new_restaurant_id, current_user_id, 'owner', 'active', trial_started_at);

  trial_ends_at := trial_started_at + make_interval(days => plan_trial_days);

  insert into public.restaurant_subscriptions (
    restaurant_id,
    plan_id,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end,
    billing_cycle
  )
  values (
    new_restaurant_id,
    session_row.selected_plan_id,
    'trialing',
    trial_ends_at,
    trial_started_at,
    trial_ends_at,
    session_row.billing_cycle
  );

  update public.onboarding_sessions
  set
    restaurant_id = new_restaurant_id,
    current_step = 'operations'
  where user_id = current_user_id;

  return new_restaurant_id;
end;
$$;

create or replace function public.save_onboarding_operations(
  selected_service_modes public.order_type[],
  requested_table_count integer,
  requested_tax_rate numeric default 0
)
returns public.onboarding_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  session_row public.onboarding_sessions%rowtype;
  normalized_table_count integer := coalesce(requested_table_count, 0);
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into session_row
  from public.onboarding_sessions session
  where session.user_id = current_user_id
  for update;

  if not found or session_row.restaurant_id is null then
    raise exception 'Restaurant must be created before operations are configured';
  end if;

  if not private.has_restaurant_role(
    session_row.restaurant_id,
    array['owner']::public.member_role[]
  ) then
    raise exception 'Only the restaurant owner can update onboarding';
  end if;

  if coalesce(cardinality(selected_service_modes), 0) = 0
    or exists (
      select 1
      from unnest(selected_service_modes) as modes(mode)
      where modes.mode is null
    )
  then
    raise exception 'At least one service mode is required';
  end if;

  if (select count(*) from unnest(selected_service_modes) as modes(mode))
    <> (select count(distinct modes.mode) from unnest(selected_service_modes) as modes(mode))
  then
    raise exception 'Service modes cannot contain duplicates';
  end if;

  if normalized_table_count < 0 or normalized_table_count > 200 then
    raise exception 'Table count must be between 0 and 200';
  end if;

  if not ('dine_in'::public.order_type = any(selected_service_modes)) then
    normalized_table_count := 0;
  end if;

  if requested_tax_rate is null or requested_tax_rate < 0 or requested_tax_rate > 100 then
    raise exception 'Tax rate must be between 0 and 100';
  end if;

  update public.restaurants
  set
    service_modes = selected_service_modes,
    tax_rate = requested_tax_rate
  where id = session_row.restaurant_id;

  update public.onboarding_sessions
  set
    table_count = normalized_table_count,
    current_step = case
      when current_step = 'operations' then 'plan'::public.onboarding_step
      else current_step
    end
  where user_id = current_user_id
  returning * into session_row;

  return session_row;
end;
$$;

create or replace function public.save_onboarding_plan(
  requested_plan_id text,
  requested_billing_cycle public.billing_cycle
)
returns public.onboarding_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_plan_id text := lower(trim(coalesce(requested_plan_id, '')));
  selected_trial_days integer;
  session_row public.onboarding_sessions%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select plan.trial_days
  into selected_trial_days
  from public.subscription_plans plan
  where plan.id = normalized_plan_id
    and plan.is_active = true
    and plan.trial_enabled = true;

  if not found then
    raise exception 'Selected plan is not available for onboarding';
  end if;

  select *
  into session_row
  from public.onboarding_sessions session
  where session.user_id = current_user_id
  for update;

  if not found or session_row.restaurant_id is null then
    raise exception 'Restaurant must be created before a plan is selected';
  end if;

  if not private.has_restaurant_role(
    session_row.restaurant_id,
    array['owner']::public.member_role[]
  ) then
    raise exception 'Only the restaurant owner can update onboarding';
  end if;

  update public.restaurant_subscriptions
  set
    plan_id = normalized_plan_id,
    billing_cycle = coalesce(requested_billing_cycle, 'monthly'::public.billing_cycle),
    trial_ends_at = case
      when status = 'trialing'
        then coalesce(current_period_start, created_at) + make_interval(days => selected_trial_days)
      else trial_ends_at
    end,
    current_period_end = case
      when status = 'trialing'
        then coalesce(current_period_start, created_at) + make_interval(days => selected_trial_days)
      else current_period_end
    end
  where restaurant_id = session_row.restaurant_id;

  if not found then
    raise exception 'Restaurant subscription was not found';
  end if;

  update public.onboarding_sessions
  set
    selected_plan_id = normalized_plan_id,
    billing_cycle = coalesce(requested_billing_cycle, 'monthly'::public.billing_cycle),
    current_step = case
      when current_step = 'plan' then 'setup'::public.onboarding_step
      else current_step
    end
  where user_id = current_user_id
  returning * into session_row;

  return session_row;
end;
$$;

create or replace function public.complete_onboarding(
  starter_category_names text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  session_row public.onboarding_sessions%rowtype;
  restaurant_row public.restaurants%rowtype;
  raw_category_name text;
  normalized_category_name text;
  category_sort_order integer := 0;
  completed_timestamp timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into session_row
  from public.onboarding_sessions session
  where session.user_id = current_user_id
  for update;

  if not found or session_row.restaurant_id is null then
    raise exception 'Restaurant must be created before onboarding is completed';
  end if;

  if session_row.current_step = 'complete' then
    return session_row.restaurant_id;
  end if;

  if session_row.current_step <> 'setup' then
    raise exception 'Required onboarding steps are incomplete';
  end if;

  if not private.has_restaurant_role(
    session_row.restaurant_id,
    array['owner']::public.member_role[]
  ) then
    raise exception 'Only the restaurant owner can complete onboarding';
  end if;

  if coalesce(cardinality(starter_category_names), 0) > 20 then
    raise exception 'No more than 20 starter categories can be created';
  end if;

  select *
  into restaurant_row
  from public.restaurants restaurant
  where restaurant.id = session_row.restaurant_id
  for update;

  foreach raw_category_name in array coalesce(starter_category_names, array[]::text[])
  loop
    if raw_category_name is null then
      raise exception 'Category names cannot be null';
    end if;
    normalized_category_name := trim(raw_category_name);
    if char_length(normalized_category_name) < 1 or char_length(normalized_category_name) > 80 then
      raise exception 'Category names must contain between 1 and 80 characters';
    end if;

    insert into public.categories (restaurant_id, name, sort_order)
    values (session_row.restaurant_id, normalized_category_name, category_sort_order)
    on conflict do nothing;

    category_sort_order := category_sort_order + 1;
  end loop;

  if 'dine_in'::public.order_type = any(restaurant_row.service_modes)
    and session_row.table_count > 0
  then
    insert into public.restaurant_tables (restaurant_id, number, capacity, section)
    select
      session_row.restaurant_id,
      generated_table.table_number::text,
      4,
      'Salon'
    from generate_series(1, session_row.table_count) as generated_table(table_number)
    on conflict (restaurant_id, number) do nothing;
  end if;

  update public.restaurants
  set onboarding_completed_at = completed_timestamp
  where id = session_row.restaurant_id;

  update public.onboarding_sessions
  set
    current_step = 'complete',
    completed_at = completed_timestamp
  where user_id = current_user_id;

  return session_row.restaurant_id;
end;
$$;

revoke all on function public.start_onboarding(text, public.billing_cycle, text) from public;
revoke all on function public.create_restaurant_from_onboarding(text, text, text, text, text, text) from public;
revoke all on function public.save_onboarding_operations(public.order_type[], integer, numeric) from public;
revoke all on function public.save_onboarding_plan(text, public.billing_cycle) from public;
revoke all on function public.complete_onboarding(text[]) from public;
revoke execute on function public.create_restaurant(text, text, text, text) from authenticated;

grant execute on function public.start_onboarding(text, public.billing_cycle, text) to authenticated;
grant execute on function public.create_restaurant_from_onboarding(text, text, text, text, text, text) to authenticated;
grant execute on function public.save_onboarding_operations(public.order_type[], integer, numeric) to authenticated;
grant execute on function public.save_onboarding_plan(text, public.billing_cycle) to authenticated;
grant execute on function public.complete_onboarding(text[]) to authenticated;

commit;
