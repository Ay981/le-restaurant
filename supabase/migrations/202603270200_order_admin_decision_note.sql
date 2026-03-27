alter table public.orders
add column if not exists admin_decision_note text;