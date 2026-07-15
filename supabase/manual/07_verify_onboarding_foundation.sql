with expected_enums (enum_name) as (
  values ('onboarding_step'), ('billing_cycle')
), expected_columns (table_name, column_name) as (
  values
    ('restaurants', 'onboarding_completed_at'),
    ('restaurants', 'service_modes'),
    ('subscription_plans', 'trial_enabled'),
    ('subscription_plans', 'trial_days'),
    ('restaurant_subscriptions', 'billing_cycle'),
    ('restaurant_subscriptions', 'cancel_at_period_end'),
    ('restaurant_subscriptions', 'grace_ends_at'),
    ('restaurant_subscriptions', 'activated_at'),
    ('restaurant_subscriptions', 'cancelled_at')
), expected_functions (function_name) as (
  values
    ('start_onboarding'),
    ('create_restaurant_from_onboarding'),
    ('save_onboarding_operations'),
    ('save_onboarding_plan'),
    ('complete_onboarding')
), enum_checks as (
  select
    'enum.' || expected_enums.enum_name as check_name,
    case when types.oid is not null then 'OK' else 'MISSING' end as status,
    'required enum exists' as detail
  from expected_enums
  left join pg_namespace schemas on schemas.nspname = 'public'
  left join pg_type types
    on types.typnamespace = schemas.oid
   and types.typname = expected_enums.enum_name
), table_checks as (
  select
    'table.onboarding_sessions' as check_name,
    case when tables.oid is not null then 'OK' else 'MISSING' end as status,
    'onboarding state table exists' as detail
  from (select 1) source
  left join pg_namespace schemas on schemas.nspname = 'public'
  left join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = 'onboarding_sessions'
   and tables.relkind = 'r'
), column_checks as (
  select
    'column.' || expected_columns.table_name || '.' || expected_columns.column_name as check_name,
    case when columns.column_name is not null then 'OK' else 'MISSING' end as status,
    'required column exists' as detail
  from expected_columns
  left join information_schema.columns columns
    on columns.table_schema = 'public'
   and columns.table_name = expected_columns.table_name
   and columns.column_name = expected_columns.column_name
), rls_checks as (
  select
    'rls.onboarding_sessions' as check_name,
    case when tables.relrowsecurity then 'OK' else 'FAIL' end as status,
    'row level security is enabled' as detail
  from pg_namespace schemas
  join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = 'onboarding_sessions'
   and tables.relkind = 'r'
  where schemas.nspname = 'public'
), policy_checks as (
  select
    'policy.onboarding_sessions_select_own' as check_name,
    case when count(*) = 1 then 'OK' else 'MISSING' end as status,
    'users can only select their own onboarding state' as detail
  from pg_policies
  where schemaname = 'public'
    and tablename = 'onboarding_sessions'
    and policyname = 'onboarding_sessions_select_own'
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
), function_grant_checks as (
  select
    'grant.' || expected_functions.function_name as check_name,
    case
      when count(functions.oid) = 0 then 'MISSING'
      when bool_and(has_function_privilege('authenticated', functions.oid, 'EXECUTE'))
       and bool_and(not has_function_privilege('anon', functions.oid, 'EXECUTE'))
        then 'OK'
      else 'FAIL'
    end as status,
    'authenticated can execute and anon cannot execute' as detail
  from expected_functions
  left join pg_namespace schemas on schemas.nspname = 'public'
  left join pg_proc functions
    on functions.pronamespace = schemas.oid
   and functions.proname = expected_functions.function_name
  group by expected_functions.function_name
), direct_write_checks as (
  select
    'grant.onboarding_sessions_no_direct_write' as check_name,
    case
      when tables.oid is null then 'MISSING'
      when not has_table_privilege('authenticated', tables.oid, 'INSERT')
       and not has_table_privilege('authenticated', tables.oid, 'UPDATE')
       and not has_table_privilege('authenticated', tables.oid, 'DELETE')
        then 'OK'
      else 'FAIL'
    end as status,
    'onboarding mutations are RPC-only' as detail
  from pg_namespace schemas
  left join pg_class tables
    on tables.relnamespace = schemas.oid
   and tables.relname = 'onboarding_sessions'
   and tables.relkind = 'r'
  where schemas.nspname = 'public'
), legacy_rpc_checks as (
  select
    'grant.create_restaurant_legacy_disabled' as check_name,
    case
      when functions.oid is null then 'MISSING'
      when not has_function_privilege('authenticated', functions.oid, 'EXECUTE') then 'OK'
      else 'FAIL'
    end as status,
    'legacy restaurant creation cannot bypass onboarding' as detail
  from (select to_regprocedure('public.create_restaurant(text,text,text,text)')::oid as oid) functions
), plan_checks as (
  select
    'data.subscription_plan_onboarding_defaults' as check_name,
    case
      when count(*) = 3
       and bool_and(features @> array['reservations']::text[])
       and bool_and(trial_enabled)
       and bool_and(trial_days = 14)
        then 'OK'
      else 'FAIL'
    end as status,
    'active plans include reservations and the 14-day trial' as detail
  from public.subscription_plans
  where id in ('basic', 'standard', 'pro')
    and is_active = true
), trigger_checks as (
  select
    'trigger.onboarding_sessions_set_updated_at' as check_name,
    case when count(*) = 1 then 'OK' else 'MISSING' end as status,
    'updated_at trigger exists' as detail
  from pg_trigger
  where tgname = 'onboarding_sessions_set_updated_at'
    and not tgisinternal
)
select check_name, status, detail from enum_checks
union all
select check_name, status, detail from table_checks
union all
select check_name, status, detail from column_checks
union all
select check_name, status, detail from rls_checks
union all
select check_name, status, detail from policy_checks
union all
select check_name, status, detail from function_checks
union all
select check_name, status, detail from function_grant_checks
union all
select check_name, status, detail from direct_write_checks
union all
select check_name, status, detail from legacy_rpc_checks
union all
select check_name, status, detail from plan_checks
union all
select check_name, status, detail from trigger_checks
order by status desc, check_name;
