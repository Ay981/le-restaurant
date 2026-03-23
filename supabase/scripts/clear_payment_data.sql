-- Purpose: Manual development/testing cleanup for order and payment verification data.
-- Warning: This script is destructive and MUST NOT run in production.
-- A recent backup should exist before execution. Confirm by setting:
--   set local app.confirm_backup = 'yes';
--   set local app.clear_dev_data_confirm = 'YES_I_UNDERSTAND';

begin;

do $$
declare
	backup_confirm text := coalesce(current_setting('app.confirm_backup', true), '');
	clear_confirm text := coalesce(current_setting('app.clear_dev_data_confirm', true), '');
	db_name text := current_database();
begin
	if backup_confirm <> 'yes' then
		raise exception 'Backup confirmation missing. Set app.confirm_backup = ''yes'' before running clear_payment_data.sql.';
	end if;

	if clear_confirm <> 'YES_I_UNDERSTAND' then
		raise exception 'Confirmation missing. Set app.clear_dev_data_confirm = ''YES_I_UNDERSTAND'' before running clear_payment_data.sql.';
	end if;

	if db_name ~* '(prod|production)' then
		raise exception 'Refusing to run destructive cleanup on database: %', db_name;
	end if;

	raise notice 'Running dev cleanup on database: %', db_name;
	raise notice 'Tables to truncate: public.payment_receipt_verifications, public.order_notifications, public.order_feedback, public.order_status_audit, public.order_items, public.orders';
end
$$;

truncate table
	public.payment_receipt_verifications,
	public.order_notifications,
	public.order_feedback,
	public.order_status_audit,
	public.order_items,
	public.orders
restart identity;

commit;
