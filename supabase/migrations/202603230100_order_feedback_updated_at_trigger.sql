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
