create table if not exists public.payment_receipt_verifications (
  id uuid primary key default gen_random_uuid(),
  order_number text not null,
  provider text not null default 'verify.leul.et',
  transaction_reference text not null,
  receipt_hash text not null,
  verified_amount numeric(10, 2),
  verified_currency text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint payment_receipt_verifications_transaction_reference_key unique (transaction_reference),
  constraint payment_receipt_verifications_receipt_hash_key unique (receipt_hash)
);

create index if not exists idx_payment_receipt_verifications_order_number
on public.payment_receipt_verifications(order_number);

alter table public.payment_receipt_verifications enable row level security;

drop policy if exists payment_receipt_verifications_authenticated_read
on public.payment_receipt_verifications;

create policy payment_receipt_verifications_authenticated_read
on public.payment_receipt_verifications
for select
to authenticated
using (true);
