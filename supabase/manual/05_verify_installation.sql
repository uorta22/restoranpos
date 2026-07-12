with expected_tables (table_name) as (
  values
    ('profiles'),
    ('restaurants'),
    ('restaurant_members'),
    ('restaurant_invitations'),
    ('courier_profiles'),
    ('subscription_plans'),
    ('restaurant_subscriptions'),
    ('categories'),
    ('products'),
    ('restaurant_tables'),
    ('orders'),
    ('order_items'),
    ('payments'),
    ('reservations'),
    ('suppliers'),
    ('inventory_items'),
    ('stock_movements'),
    ('deliveries'),
    ('notifications')
), expected_functions (function_name) as (
  values
    ('create_restaurant'),
    ('create_restaurant_invitation'),
    ('create_courier_invitation'),
    ('get_restaurant_invitation'),
    ('accept_restaurant_invitation'),
    ('set_restaurant_member_role'),
    ('remove_restaurant_member'),
    ('create_order'),
    ('set_order_status'),
    ('record_order_payment'),
    ('assign_delivery_courier'),
    ('set_delivery_status'),
    ('set_inventory_stock'),
    ('get_delivery_tracking')
), expected_triggers (trigger_name) as (
  values
    ('on_auth_user_created_profile'),
    ('on_auth_user_email_changed'),
    ('orders_create_notifications'),
    ('deliveries_create_notifications')
), expected_realtime_tables (table_name) as (
  values
    ('orders'),
    ('restaurant_tables'),
    ('deliveries'),
    ('notifications'),
    ('restaurant_members'),
    ('courier_profiles')
), table_checks as (
  select
    'table.' || expected_tables.table_name as check_name,
    case when tables.oid is not null then 'OK' else 'MISSING' end as status,
    'public table exists' as detail
  from expected_tables
  left join pg_namespace schemas on schemas.nspname = 'public'
  left join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = expected_tables.table_name
   and tables.relkind = 'r'
), rls_checks as (
  select
    'rls.' || expected_tables.table_name as check_name,
    case when tables.relrowsecurity then 'OK' else 'FAIL' end as status,
    'row level security is enabled' as detail
  from expected_tables
  join pg_namespace schemas on schemas.nspname = 'public'
  join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = expected_tables.table_name
   and tables.relkind = 'r'
), policy_checks as (
  select
    'policy.' || expected_tables.table_name as check_name,
    case when count(policies.oid) > 0 then 'OK' else 'FAIL' end as status,
    count(policies.oid)::text || ' RLS policy found' as detail
  from expected_tables
  join pg_namespace schemas on schemas.nspname = 'public'
  join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = expected_tables.table_name
   and tables.relkind = 'r'
  left join pg_policy policies on policies.polrelid = tables.oid
  group by expected_tables.table_name
), function_checks as (
  select
    'function.' || expected_functions.function_name as check_name,
    case
      when count(functions.oid) = 0 then 'MISSING'
      when bool_and(functions.prosecdef)
       and bool_and(coalesce(array_to_string(functions.proconfig, ','), '') like '%search_path%')
        then 'OK'
      else 'FAIL'
    end as status,
    'security definer function has a fixed search_path' as detail
  from expected_functions
  left join pg_namespace schemas on schemas.nspname = 'public'
  left join pg_proc functions
    on functions.pronamespace = schemas.oid
   and functions.proname = expected_functions.function_name
  group by expected_functions.function_name
), trigger_checks as (
  select
    'trigger.' || expected_triggers.trigger_name as check_name,
    case when count(triggers.oid) = 1 then 'OK' else 'MISSING' end as status,
    'required trigger exists' as detail
  from expected_triggers
  left join pg_trigger triggers
    on triggers.tgname = expected_triggers.trigger_name
   and not triggers.tgisinternal
  group by expected_triggers.trigger_name
), realtime_checks as (
  select
    'realtime.' || expected_realtime_tables.table_name as check_name,
    case when count(publication_tables.tablename) = 1 then 'OK' else 'MISSING' end as status,
    'table is in the supabase_realtime publication' as detail
  from expected_realtime_tables
  left join pg_publication_tables publication_tables
    on publication_tables.pubname = 'supabase_realtime'
   and publication_tables.schemaname = 'public'
   and publication_tables.tablename = expected_realtime_tables.table_name
  group by expected_realtime_tables.table_name
), global_checks as (
  select
    'security.no_legacy_users_table' as check_name,
    case when to_regclass('public.users') is null then 'OK' else 'FAIL' end as status,
    'application identities come from auth.users' as detail
  union all
  select
    'view.daily_sales',
    case when to_regclass('public.daily_sales') is not null then 'OK' else 'MISSING' end,
    'security-invoker reporting view exists'
  union all
  select
    'data.subscription_plans',
    case
      when count(*) = 3
       and count(*) filter (
         where description in (
           'Küçük restoranlar için temel POS özellikleri',
           'Büyüyen restoranlar için operasyon ve stok yönetimi',
           'Teslimat ve gelişmiş raporlama dahil tüm özellikler'
         )
       ) = 3
        then 'OK'
      else 'FAIL'
    end,
    'three localized subscription plans exist'
  from public.subscription_plans
)
select check_name, status, detail from table_checks
union all
select check_name, status, detail from rls_checks
union all
select check_name, status, detail from policy_checks
union all
select check_name, status, detail from function_checks
union all
select check_name, status, detail from trigger_checks
union all
select check_name, status, detail from realtime_checks
union all
select check_name, status, detail from global_checks
order by status desc, check_name;
