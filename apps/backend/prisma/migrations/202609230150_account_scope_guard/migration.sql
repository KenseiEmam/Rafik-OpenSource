create or replace function public.account_deletion_ready() returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if identity.actor_id() is null then raise exception 'unauthenticated';end if;
 if exists(select 1 from public.teams where owner_id=identity.actor_id() and not archived) then raise exception 'transfer_owner_first';end if;
 if exists(select 1 from public.team_clients where state<>'closed' and (coach_id=identity.actor_id() or pending_coach_id=identity.actor_id())) then raise exception 'reassign_clients_first';end if;
 if exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id where m.user_id=identity.actor_id() and m.active and 'admin'=any(m.roles) and w.kind='organization' and not w.archived and not exists(select 1 from public.workspace_members other where other.workspace_id=m.workspace_id and other.user_id<>identity.actor_id() and other.active and 'admin'=any(other.roles))) then raise exception 'last_admin';end if;
end $$;
