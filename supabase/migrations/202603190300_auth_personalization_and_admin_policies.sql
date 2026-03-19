do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('customer', 'admin');
  end if;
end$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_auth_user_profile on auth.users;
create trigger trg_auth_user_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin
on public.profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists categories_admin_manage on public.categories;
create policy categories_admin_manage
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists dishes_admin_manage on public.dishes;
create policy dishes_admin_manage
on public.dishes
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.orders
add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_customer_user_id on public.orders(customer_user_id);

drop policy if exists orders_authenticated_all on public.orders;

drop policy if exists orders_select_owner_or_admin on public.orders;
create policy orders_select_owner_or_admin
on public.orders
for select
to authenticated
using (customer_user_id = auth.uid() or public.is_admin());

drop policy if exists orders_insert_guest_or_owner on public.orders;
create policy orders_insert_guest_or_owner
on public.orders
for insert
to anon, authenticated
with check (
  customer_user_id is null
  or customer_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists orders_update_owner_or_admin on public.orders;
create policy orders_update_owner_or_admin
on public.orders
for update
to authenticated
using (customer_user_id = auth.uid() or public.is_admin())
with check (
  customer_user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists orders_delete_owner_or_admin on public.orders;
create policy orders_delete_owner_or_admin
on public.orders
for delete
to authenticated
using (customer_user_id = auth.uid() or public.is_admin());

drop policy if exists order_items_authenticated_all on public.order_items;

drop policy if exists order_items_select_owner_or_admin on public.order_items;
create policy order_items_select_owner_or_admin
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists order_items_insert_guest_or_owner on public.order_items;
create policy order_items_insert_guest_or_owner
on public.order_items
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (
        o.customer_user_id is null
        or o.customer_user_id = auth.uid()
        or public.is_admin()
      )
  )
);

drop policy if exists order_items_update_owner_or_admin on public.order_items;
create policy order_items_update_owner_or_admin
on public.order_items
for update
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists order_items_delete_owner_or_admin on public.order_items;
create policy order_items_delete_owner_or_admin
on public.order_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.customer_user_id = auth.uid() or public.is_admin())
  )
);
