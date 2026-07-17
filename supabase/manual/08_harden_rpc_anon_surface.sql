begin;

-- Kamuya açık kalması gerekenler: get_delivery_tracking (token'lı takip), get_restaurant_invitation (davet önizleme).
-- Geri kalan tüm RPC'lerden anon EXECUTE kaldırılıyor; trigger fonksiyonları REST yüzeyinden tamamen çıkarılıyor.

revoke execute on function public.accept_restaurant_invitation(uuid) from anon;
revoke execute on function public.assign_delivery_courier(uuid, uuid) from anon;
revoke execute on function public.create_courier_invitation(uuid, text, text, text, text, text) from anon;
revoke execute on function public.create_order(uuid, jsonb, public.order_type, uuid, text, text, text, jsonb, public.payment_method, boolean) from anon;
revoke execute on function public.create_restaurant(text, text, text, text) from anon;
revoke execute on function public.create_restaurant_invitation(uuid, text, public.member_role) from anon;
revoke execute on function public.record_order_payment(uuid, public.payment_method, numeric, text) from anon;
revoke execute on function public.remove_restaurant_member(uuid, uuid) from anon;
revoke execute on function public.set_delivery_status(uuid, public.delivery_status, numeric, numeric) from anon;
revoke execute on function public.set_inventory_stock(uuid, numeric, text) from anon;
revoke execute on function public.set_order_status(uuid, public.order_status) from anon;
revoke execute on function public.set_restaurant_member_role(uuid, uuid, public.member_role) from anon;

-- Trigger fonksiyonları: hiçbir istemci rolü çağıramamalı.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_auth_user_email_change() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

commit;
