alter table public.payment_receipt_verifications
  add column if not exists review_status text not null default 'pending'
    check (review_status in ('pending', 'accepted', 'rejected')),
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

create index if not exists idx_payment_receipt_verifications_review_status_created_at
  on public.payment_receipt_verifications(review_status, created_at desc);

create table if not exists public.staff_order_notifications (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  receipt_verification_id uuid not null references public.payment_receipt_verifications(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  action_status text not null default 'pending' check (action_status in ('pending', 'accepted', 'rejected')),
  actioned_at timestamptz,
  actioned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (receipt_verification_id)
);

create index if not exists idx_staff_order_notifications_pending
  on public.staff_order_notifications(action_status, is_read, created_at desc);

create index if not exists idx_staff_order_notifications_order_id_created_at
  on public.staff_order_notifications(order_id, created_at desc);

alter table public.staff_order_notifications enable row level security;
