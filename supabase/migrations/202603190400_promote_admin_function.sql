create or replace function public.promote_user_to_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  target_user_id uuid;
  requester_email text;
  has_existing_admin boolean;
begin
  normalized_email := lower(trim(coalesce(target_email, '')));

  if normalized_email = '' then
    raise exception 'Email is required.';
  end if;

  select exists(
    select 1
    from public.profiles
    where role = 'admin'
  ) into has_existing_admin;

  if not public.is_admin() then
    if has_existing_admin then
      raise exception 'Only admins can promote users.';
    end if;

    if auth.uid() is null then
      raise exception 'Authentication is required.';
    end if;

    select lower(email)
    into requester_email
    from auth.users
    where id = auth.uid();

    if requester_email is null or requester_email <> normalized_email then
      raise exception 'First admin bootstrap can only promote your own account.';
    end if;
  end if;

  select id
  into target_user_id
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if target_user_id is null then
    raise exception 'No user found with that email.';
  end if;

  insert into public.profiles (user_id, role)
  values (target_user_id, 'admin')
  on conflict (user_id)
  do update
  set role = 'admin',
      updated_at = now();

  return 'User promoted to admin successfully.';
end;
$$;

revoke all on function public.promote_user_to_admin(text) from public;
grant execute on function public.promote_user_to_admin(text) to authenticated;
