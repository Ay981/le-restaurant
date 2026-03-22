do $$
begin
  alter type public.app_role add value if not exists 'staff';
exception
  when duplicate_object then null;
end$$;

create or replace function public.is_admin_or_staff()
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
      and p.role::text in ('admin', 'staff')
  );
$$;

alter table public.orders
add column if not exists started_at timestamptz,
add column if not exists delivered_at timestamptz,
add column if not exists delivery_address text,
add column if not exists customer_name text,
add column if not exists customer_phone text,
add column if not exists last_status_changed_by uuid references auth.users(id) on delete set null;

update public.orders
set started_at = coalesce(started_at, updated_at)
where status in ('preparing', 'served', 'completed')
  and started_at is null;

update public.orders
set delivered_at = coalesce(delivered_at, updated_at)
where status in ('served', 'completed')
  and delivered_at is null;

alter table public.orders
drop constraint if exists orders_delivery_fields_required;

alter table public.orders
add constraint orders_delivery_fields_required
check (
  order_type <> 'delivery'
  or (
    nullif(trim(coalesce(delivery_address, '')), '') is not null
    and nullif(trim(coalesce(customer_name, '')), '') is not null
    and nullif(trim(coalesce(customer_phone, '')), '') is not null
  )
);

create table if not exists public.order_status_audit (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists idx_order_status_audit_order_id_changed_at on public.order_status_audit(order_id, changed_at desc);
create index if not exists idx_orders_started_at on public.orders(started_at desc nulls last);
create index if not exists idx_orders_delivered_at on public.orders(delivered_at desc nulls last);
