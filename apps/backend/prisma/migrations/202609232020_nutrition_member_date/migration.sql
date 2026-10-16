-- Server-only date projection; do not broaden profile-table access for organization services.
create function public.organization_member_today(p_member uuid) returns date
language sql stable security definer set search_path=public,pg_temp as $$
 select (now() at time zone coalesce(p.timezone,'UTC'))::date
 from public.workspace_members m left join public.profiles p on p.id=m.user_id
 where m.id=p_member
$$;
revoke all on function public.organization_member_today(uuid) from public,rafik_guest,rafik_user;
grant execute on function public.organization_member_today(uuid) to rafik_api;
