create table if not exists public.order_feedback (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  comment text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, customer_user_id)
);

create index if not exists idx_order_feedback_order_id on public.order_feedback(order_id);
create index if not exists idx_order_feedback_customer_user_id on public.order_feedback(customer_user_id);
create index if not exists idx_order_feedback_status on public.order_feedback(status);

create table if not exists public.order_notifications (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  status_from public.order_status,
  status_to public.order_status not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_order_notifications_customer_created_at
  on public.order_notifications(customer_user_id, created_at desc);
create index if not exists idx_order_notifications_customer_unread
  on public.order_notifications(customer_user_id, is_read, created_at desc);

alter table public.order_feedback enable row level security;
alter table public.order_notifications enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_order_feedback_updated_at on public.order_feedback;
create trigger set_order_feedback_updated_at
before update on public.order_feedback
for each row
execute function public.set_updated_at();
