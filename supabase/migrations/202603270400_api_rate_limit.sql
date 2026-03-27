create table if not exists public.api_rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (key, window_start)
);

create index if not exists idx_api_rate_limits_window_start
  on public.api_rate_limits(window_start);

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return query select false, greatest(1, p_window_seconds);
    return;
  end if;

  if p_limit <= 0 then
    return query select false, greatest(1, p_window_seconds);
    return;
  end if;

  if p_window_seconds <= 0 then
    return query select false, 1;
    return;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (key, window_start, count, created_at, updated_at)
  values (p_key, v_window_start, 1, v_now, v_now)
  on conflict (key, window_start)
  do update
    set count = public.api_rate_limits.count + 1,
        updated_at = excluded.updated_at
  returning public.api_rate_limits.count into v_count;

  delete from public.api_rate_limits
  where window_start < (v_now - interval '1 day');

  if v_count > p_limit then
    return query
    select
      false,
      greatest(
        1,
        p_window_seconds - (
          extract(epoch from v_now)::integer % p_window_seconds
        )
      );
    return;
  end if;

  return query select true, 0;
end;
$$;

revoke all on table public.api_rate_limits from anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
