create table if not exists public.customer_messages (
  id bigint generated always as identity primary key,
  customer_user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  admin_note text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_messages_customer_user_id
  on public.customer_messages(customer_user_id, created_at desc);
create index if not exists idx_customer_messages_order_id
  on public.customer_messages(order_id, created_at desc);
create index if not exists idx_customer_messages_status
  on public.customer_messages(status, created_at desc);

alter table public.customer_messages enable row level security;

drop trigger if exists set_customer_messages_updated_at on public.customer_messages;
create trigger set_customer_messages_updated_at
before update on public.customer_messages
for each row
execute function public.set_updated_at();
