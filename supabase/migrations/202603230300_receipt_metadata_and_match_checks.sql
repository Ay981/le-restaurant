alter table public.payment_receipt_verifications
  add column if not exists receipt_file_path text,
  add column if not exists receipt_file_name text,
  add column if not exists receipt_mime_type text,
  add column if not exists expected_amount numeric(10, 2),
  add column if not exists amount_matches_expected boolean,
  add column if not exists expected_receiver text,
  add column if not exists verified_receiver text,
  add column if not exists receiver_matches_expected boolean;
