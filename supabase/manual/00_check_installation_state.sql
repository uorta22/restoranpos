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
), installation_state as (
  select
    table_name,
    to_regclass(format('public.%I', table_name)) is not null as is_present
  from expected_tables
)
select
  case
    when count(*) filter (where is_present) = 0 then 'FRESH'
    when bool_and(is_present) then 'INSTALLED'
    else 'PARTIAL'
  end as installation_state,
  count(*) filter (where is_present) as present_table_count,
  count(*) as expected_table_count,
  coalesce(
    array_agg(table_name order by table_name) filter (where not is_present),
    array[]::text[]
  ) as missing_tables
from installation_state;
