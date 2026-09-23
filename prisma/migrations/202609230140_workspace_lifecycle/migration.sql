-- Organization history belongs to the organization after a person leaves or deletes an account.
alter table public.workspace_members add column name text not null default 'Former member';
update public.workspace_members m set name=p.display_name from public.profiles p where p.id=m.user_id;
alter table public.workspace_members alter column user_id drop not null;
alter table public.workspace_members drop constraint workspace_members_user_id_fkey;
alter table public.workspace_members add constraint workspace_members_user_id_fkey foreign key(user_id) references identity.users(id) on delete set null;
create or replace function public.account_deletion_ready() returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if identity.actor_id() is null then raise exception 'unauthenticated';end if;
 if exists(select 1 from public.teams where owner_id=identity.actor_id() and not archived) then raise exception 'team_ownership_required';end if;
 if exists(select 1 from public.workspace_members m join public.workspaces w on w.id=m.workspace_id where m.user_id=identity.actor_id() and m.active and 'admin'=any(m.roles) and w.kind='organization' and not w.archived and not exists(select 1 from public.workspace_members other where other.workspace_id=m.workspace_id and other.user_id<>identity.actor_id() and other.active and 'admin'=any(other.roles))) then raise exception 'last_admin';end if;
end $$;
create or replace function public.delete_my_account(p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation';end if;
 -- Same advisory lock order as workspace commands; prevents concurrent last-admin departure.
 perform pg_advisory_xact_lock(hashtextextended(w.id::text,73)) from public.workspaces w where w.id in(select workspace_id from public.workspace_members where user_id=identity.actor_id()) order by w.id;
 perform id from public.teams where id in(select team_id from public.team_members where user_id=identity.actor_id()) order by id for update;
 perform public.account_deletion_ready();
 perform id from public.profiles where id=identity.actor_id() for update;
 if exists(select 1 from public.resources where owner_id=identity.actor_id()) then raise exception 'file_cleanup_required';end if;
 update public.workspace_members set trainer_id=null,revision=revision+1 where trainer_id in(select id from public.workspace_members where user_id=identity.actor_id());
 update public.workspace_members set active=false,trainer_id=null,name='Former member',revision=revision+1 where user_id=identity.actor_id();
 delete from public.workspaces where kind='independent' and created_by=identity.actor_id();
 update public.appointment_slots set state='open' where starts_at>now() and id in(select a.slot_id from public.appointments a join public.coach_clients c on c.id=a.relationship_id where c.client_id=identity.actor_id() and a.state='booked');
 delete from identity.users where id=identity.actor_id();
end $$;
