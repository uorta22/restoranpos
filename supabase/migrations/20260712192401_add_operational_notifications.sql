create or replace function private.notify_restaurant_roles(
  target_restaurant_id uuid,
  target_roles public.member_role[],
  notification_title text,
  notification_message text,
  notification_type text,
  target_order_id uuid
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.notifications (
    restaurant_id,
    user_id,
    title,
    message,
    type,
    related_order_id
  )
  select
    member.restaurant_id,
    member.user_id,
    notification_title,
    notification_message,
    notification_type,
    target_order_id
  from public.restaurant_members member
  where member.restaurant_id = target_restaurant_id
    and member.status = 'active'
    and member.role = any (target_roles);
$$;

revoke all on function private.notify_restaurant_roles(uuid, public.member_role[], text, text, text, uuid)
from public, anon, authenticated;

create or replace function private.notify_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_reference text := right(new.id::text, 6);
begin
  if tg_op = 'INSERT' then
    perform private.notify_restaurant_roles(
      new.restaurant_id,
      array['kitchen']::public.member_role[],
      'Yeni sipariş',
      format('Sipariş #%s mutfağa iletildi.', order_reference),
      'info',
      new.id
    );
    return new;
  end if;

  if old.status is distinct from new.status and new.status = 'ready' then
    perform private.notify_restaurant_roles(
      new.restaurant_id,
      array['owner', 'manager', 'cashier', 'waiter']::public.member_role[],
      'Sipariş hazır',
      format('Sipariş #%s servise hazır.', order_reference),
      'success',
      new.id
    );
  elsif old.status is distinct from new.status and new.status = 'cancelled' then
    perform private.notify_restaurant_roles(
      new.restaurant_id,
      array['owner', 'manager', 'cashier', 'waiter']::public.member_role[],
      'Sipariş iptal edildi',
      format('Sipariş #%s iptal edildi.', order_reference),
      'warning',
      new.id
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_order_change() from public, anon, authenticated;

create trigger orders_create_notifications
after insert or update of status on public.orders
for each row execute function private.notify_order_change();

create or replace function private.notify_delivery_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_reference text := right(new.order_id::text, 6);
begin
  if new.courier_user_id is not null
    and (tg_op = 'INSERT' or old.courier_user_id is distinct from new.courier_user_id) then
    insert into public.notifications (
      restaurant_id,
      user_id,
      title,
      message,
      type,
      related_order_id
    )
    select
      new.restaurant_id,
      member.user_id,
      'Yeni teslimat',
      format('Sipariş #%s size atandı.', order_reference),
      'info',
      new.order_id
    from public.restaurant_members member
    where member.restaurant_id = new.restaurant_id
      and member.user_id = new.courier_user_id
      and member.role = 'courier'
      and member.status = 'active';
  end if;

  if tg_op = 'UPDATE'
    and old.status is distinct from new.status
    and new.status = 'delivered' then
    perform private.notify_restaurant_roles(
      new.restaurant_id,
      array['owner', 'manager', 'cashier', 'waiter']::public.member_role[],
      'Teslimat tamamlandı',
      format('Sipariş #%s müşteriye teslim edildi.', order_reference),
      'success',
      new.order_id
    );
  end if;

  return new;
end;
$$;

revoke all on function private.notify_delivery_change() from public, anon, authenticated;

create trigger deliveries_create_notifications
after insert or update of courier_user_id, status on public.deliveries
for each row execute function private.notify_delivery_change();
