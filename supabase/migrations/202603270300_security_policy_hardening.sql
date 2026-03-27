-- Harden row-level access policies for customer/admin-staff surfaces.

drop policy if exists categories_admin_manage on public.categories;
create policy categories_admin_or_staff_manage
on public.categories
for all
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists dishes_admin_manage on public.dishes;
create policy dishes_admin_or_staff_manage
on public.dishes
for all
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists customer_messages_select_owner_or_admin_staff on public.customer_messages;
create policy customer_messages_select_owner_or_admin_staff
on public.customer_messages
for select
to authenticated
using (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists customer_messages_insert_owner on public.customer_messages;
create policy customer_messages_insert_owner
on public.customer_messages
for insert
to authenticated
with check (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists customer_messages_update_admin_staff on public.customer_messages;
create policy customer_messages_update_admin_staff
on public.customer_messages
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists order_feedback_select_owner_or_admin_staff on public.order_feedback;
create policy order_feedback_select_owner_or_admin_staff
on public.order_feedback
for select
to authenticated
using (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists order_feedback_insert_owner on public.order_feedback;
create policy order_feedback_insert_owner
on public.order_feedback
for insert
to authenticated
with check (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists order_feedback_update_owner_or_admin_staff on public.order_feedback;
create policy order_feedback_update_owner_or_admin_staff
on public.order_feedback
for update
to authenticated
using (customer_user_id = auth.uid() or public.is_admin_or_staff())
with check (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists order_notifications_select_owner_or_admin_staff on public.order_notifications;
create policy order_notifications_select_owner_or_admin_staff
on public.order_notifications
for select
to authenticated
using (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists order_notifications_update_owner_or_admin_staff on public.order_notifications;
create policy order_notifications_update_owner_or_admin_staff
on public.order_notifications
for update
to authenticated
using (customer_user_id = auth.uid() or public.is_admin_or_staff())
with check (customer_user_id = auth.uid() or public.is_admin_or_staff());

drop policy if exists staff_order_notifications_select_admin_staff on public.staff_order_notifications;
create policy staff_order_notifications_select_admin_staff
on public.staff_order_notifications
for select
to authenticated
using (public.is_admin_or_staff());

drop policy if exists staff_order_notifications_update_admin_staff on public.staff_order_notifications;
create policy staff_order_notifications_update_admin_staff
on public.staff_order_notifications
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());
