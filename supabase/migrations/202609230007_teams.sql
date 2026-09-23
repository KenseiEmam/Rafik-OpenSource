-- Optional team coordination. Existing private coaching ownership is unchanged.
create table public.teams (
 id uuid primary key, owner_id uuid references public.profiles(id) on delete set null,
 name text not null check(char_length(name) between 1 and 100), archived boolean not null default false,
 revision int not null default 1, created_at timestamptz not null default now(),check(archived or owner_id is not null)
);
create table public.team_members (
 id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, role text not null check(role in('admin','coach')),
 state text not null default 'active' check(state in('active','removed')), unique(team_id,user_id)
);
create table public.team_invitations (
 id uuid primary key,team_id uuid not null references public.teams(id) on delete cascade,
 email text not null,role text not null check(role in('admin','coach')),token_hash text not null unique,
 state text not null default 'pending' check(state in('pending','accepted','revoked')),
 accepted_by uuid references public.profiles(id) on delete set null,expires_at timestamptz not null default now()+interval '7 days'
);
create table public.team_clients (
 id uuid primary key,team_id uuid not null references public.teams(id) on delete cascade,
 client_id uuid not null references public.profiles(id) on delete cascade,
 relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 coach_id uuid references public.profiles(id) on delete set null,
 pending_coach_id uuid references public.profiles(id) on delete set null,
 state text not null default 'pending' check(state in('pending','active','closed')),
 last_response_revision int,last_accept boolean,revision int not null default 1,created_at timestamptz not null default now()
);
create unique index team_one_enrollment on public.team_clients(team_id,client_id) where state<>'closed';
create unique index relationship_one_team on public.team_clients(relationship_id) where state<>'closed';
create table public.team_groups (
 id uuid primary key,team_id uuid not null references public.teams(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 100),revision int not null default 1,archived boolean not null default false
);
create table public.team_group_members (
 id uuid primary key default gen_random_uuid(),group_id uuid not null references public.team_groups(id) on delete cascade,
 client_id uuid not null references public.team_clients(id) on delete cascade,unique(group_id,client_id)
);
create table public.team_plans (
 id uuid primary key,team_id uuid not null references public.teams(id) on delete cascade,
 contributor_id uuid references public.profiles(id) on delete set null,source_id uuid references public.plan_versions(id) on delete set null,
 title text not null,prescription jsonb not null,archived boolean not null default false,created_at timestamptz not null default now()
);
alter table public.plans add column team_template_id uuid references public.team_plans(id) on delete set null;
create table public.team_resource_shares (
 id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,
 resource_id uuid not null references public.resources(id) on delete cascade,unique(team_id,resource_id)
);
create table public.team_assignments (
 id uuid primary key,group_id uuid not null references public.team_groups(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null,version_id uuid references public.plan_versions(id) on delete set null,
 client_ids uuid[] not null,created_at timestamptz not null default now()
);
create table public.team_activity (
 id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null,action text not null,subject_id uuid,created_at timestamptz not null default now()
);
create function public.team_role(p_team uuid) returns text language sql stable security definer set search_path=public,pg_temp as $$
 select case when t.owner_id=auth.uid() then 'owner' else m.role end from public.teams t join public.team_members m on m.team_id=t.id and m.user_id=auth.uid() and m.state='active' where t.id=p_team and not t.archived;
$$;
create function public.team_log(p_team uuid,p_action text,p_subject uuid default null) returns void language sql security definer set search_path=public,pg_temp as $$
 insert into public.team_activity(team_id,actor_id,action,subject_id) values(p_team,auth.uid(),p_action,p_subject);
$$;
create function public.create_team(p_id uuid,p_name text) returns public.teams language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.teams;begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into t from public.teams where id=p_id;
 if found then if t.owner_id<>auth.uid() or t.name is distinct from trim(p_name) then raise exception 'conflict';end if;return t;end if;
 insert into public.teams(id,owner_id,name) values(p_id,auth.uid(),trim(p_name)) returning * into t;
 insert into public.team_members(team_id,user_id,role) values(t.id,auth.uid(),'admin');
 perform public.open_business_account(t.id,t.id);perform public.team_log(t.id,'team_created');return t;
end $$;
create function public.invite_team_member(p_id uuid,p_team uuid,p_email text,p_role text,p_token text) returns public.team_invitations language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.team_invitations;begin
 perform id from public.teams where id=p_team for update;
 if coalesce(public.team_role(p_team),'') not in('owner','admin') or (p_role='admin' and public.team_role(p_team)<>'owner') then raise exception 'forbidden';end if;
 select * into i from public.team_invitations where id=p_id;
 if found then if i.team_id<>p_team or i.email is distinct from lower(trim(p_email)) or i.role is distinct from p_role or i.token_hash<>encode(extensions.digest(p_token,'sha256'),'hex') then raise exception 'conflict';end if;return i;end if;
 perform public.require_team_growth(p_team,'staff');
 if coalesce(p_role,'') not in('admin','coach') or coalesce(p_email,'') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(p_email)>254 or char_length(coalesce(p_token,''))<32 then raise exception 'invalid_invitation';end if;
 if exists(select 1 from public.team_members m join auth.users u on u.id=m.user_id where m.team_id=p_team and m.state='active' and lower(u.email)=lower(trim(p_email))) then raise exception 'already_member';end if;
 insert into public.team_invitations(id,team_id,email,role,token_hash) values(p_id,p_team,lower(trim(p_email)),p_role,encode(extensions.digest(p_token,'sha256'),'hex')) returning * into i;
 perform public.team_log(p_team,'staff_invited',i.id);return i;
end $$;
create function public.team_invitation(p_token text) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('team_name',t.name,'role',i.role,'state',case when t.archived or i.state='revoked' or (i.state='pending' and i.expires_at<=now()) then 'unavailable' else i.state end) from public.team_invitations i join public.teams t on t.id=i.team_id where i.token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
$$;
create function public.accept_team_invitation(p_token text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.team_invitations;begin
 select * into i from public.team_invitations where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
 if not found then raise exception 'invitation_unavailable';end if;
 perform id from public.teams where id=i.team_id for update;select * into i from public.team_invitations where id=i.id for update;
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and lower(email)=i.email) then raise exception 'wrong_email';end if;
 if i.state='accepted' and i.accepted_by=auth.uid() then return i.team_id;end if;
 if i.state<>'pending' or i.expires_at<=now() or exists(select 1 from public.teams where id=i.team_id and archived) then raise exception 'invitation_unavailable';end if;
 perform public.require_team_growth(i.team_id,'accept_staff');
 insert into public.team_members(team_id,user_id,role) values(i.team_id,auth.uid(),i.role) on conflict(team_id,user_id) do update set state='active',role=excluded.role;
 update public.team_invitations set state='accepted',accepted_by=auth.uid() where id=i.id;
 perform public.team_log(i.team_id,'staff_joined',auth.uid());return i.team_id;
end $$;
create function public.revoke_team_invitation(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare i public.team_invitations;begin
 select * into i from public.team_invitations where id=p_id;
 perform id from public.teams where id=i.team_id for update;
 if coalesce(public.team_role(i.team_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if i.state='accepted' then raise exception 'already_member';end if;
 update public.team_invitations set state='revoked' where id=p_id;perform public.team_log(i.team_id,'invite_revoked',p_id);
end $$;
create function public.change_team_member(p_team uuid,p_user uuid,p_action text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.teams; m public.team_members;begin
 select * into t from public.teams where id=p_team for update;
 select * into m from public.team_members where team_id=p_team and user_id=p_user;
 if not found then raise exception 'forbidden';end if;
 if p_user=t.owner_id then
  if p_action='owner' and exists(select 1 from public.team_activity where team_id=p_team and actor_id=auth.uid() and action='member_owner' and subject_id=p_user) then return;end if;
  raise exception 'transfer_owner_first';
 end if;
 if m.state='removed' then
  if p_action='remove' and (auth.uid()=p_user or public.team_role(p_team) in('owner','admin')) then return;end if;
  raise exception 'forbidden';
 end if;
 if p_action='remove' then
  if auth.uid()<>p_user and coalesce(public.team_role(p_team),'') not in('owner','admin') then raise exception 'forbidden';end if;
  if auth.uid()<>t.owner_id and auth.uid()<>p_user and m.role='admin' then raise exception 'forbidden';end if;
  if exists(select 1 from public.team_clients where team_id=p_team and state<>'closed' and (coach_id=p_user or pending_coach_id=p_user)) then raise exception 'reassign_clients_first';end if;
  update public.team_members set state='removed' where id=m.id;
 elsif p_action in('admin','coach') then
  if auth.uid()<>t.owner_id then raise exception 'forbidden';end if;
  update public.team_members set role=p_action where id=m.id;
 elsif p_action='owner' then
  if auth.uid()<>t.owner_id then raise exception 'forbidden';end if;
  update public.teams set owner_id=p_user,revision=revision+1 where id=p_team;
 else raise exception 'invalid_action';end if;
 perform public.team_log(p_team,'member_'||p_action,p_user);
end $$;
create function public.rename_team(p_id uuid,p_name text,p_revision int) returns public.teams language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.teams;begin
 select * into t from public.teams where id=p_id for update;
 if coalesce(public.team_role(p_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if t.name=trim(p_name) then return t;end if;
 if t.revision is distinct from p_revision then raise exception 'conflict';end if;
 update public.teams set name=trim(p_name),revision=revision+1 where id=p_id returning * into t;
 perform public.team_log(p_id,'team_renamed');return t;
end $$;
create function public.close_team(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.teams;begin
 select * into t from public.teams where id=p_id for update;
 if not found or t.owner_id<>auth.uid() then raise exception 'forbidden';end if;
 if t.archived then return;end if;if t.revision is distinct from p_revision then raise exception 'conflict';end if;
 if exists(select 1 from public.team_clients where team_id=p_id and state<>'closed') then raise exception 'close_enrollments_first';end if;
 -- Empty means no active client enrollments, not no staff. Closing revokes all team access.
 update public.team_invitations set state='revoked' where team_id=p_id and state='pending';
 update public.teams set archived=true,revision=revision+1 where id=p_id;perform public.team_log(p_id,'team_closed');
end $$;
create function public.propose_team_client(p_id uuid,p_team uuid,p_relationship uuid) returns public.team_clients language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; e public.team_clients;begin
 perform id from public.teams where id=p_team for update;
 if public.team_role(p_team) is null then raise exception 'forbidden';end if;
 select * into c from public.coach_clients where id=p_relationship and coach_id=auth.uid() and state='active' for update;
 if not found then raise exception 'forbidden';end if;
 select * into e from public.team_clients where id=p_id;
 if found then if e.team_id<>p_team or e.relationship_id<>p_relationship then raise exception 'conflict';end if;return e;end if;
 perform public.require_team_growth(p_team,'client');
 insert into public.team_clients(id,team_id,client_id,relationship_id,coach_id) values(p_id,p_team,c.client_id,c.id,c.coach_id) returning * into e;
 perform public.team_log(p_team,'client_proposed',e.id);return e;
end $$;
create function public.request_team_handoff(p_id uuid,p_revision int,p_coach uuid) returns public.team_clients language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.team_clients;begin
 select * into e from public.team_clients where id=p_id;perform id from public.teams where id=e.team_id for update;
 select * into e from public.team_clients where id=p_id for update;
 if coalesce(public.team_role(e.team_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if e.state<>'active' then raise exception 'enrollment_unavailable';end if;
 if e.pending_coach_id is not distinct from p_coach then return e;end if;
 if e.revision is distinct from p_revision then raise exception 'conflict';end if;
 if p_coach is not null and (p_coach in(e.coach_id,e.client_id) or not exists(select 1 from public.team_members where team_id=e.team_id and user_id=p_coach and state='active')) then raise exception 'invalid_coach';end if;
 update public.team_clients set pending_coach_id=p_coach,revision=revision+1 where id=p_id returning * into e;
 perform public.team_log(e.team_id,'handoff_requested',e.id);return e;
end $$;
-- Internal import uses trusted, previously published snapshots, never arbitrary caller JSON.
create function public.copy_snapshot_plan(p_id uuid,p_owner uuid,p_title text,p_snapshot jsonb,p_template uuid default null) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.plans; d jsonb; e jsonb; info jsonb; new_id text; days jsonb:='[]'::jsonb; entries jsonb; draft jsonb:=p_snapshot;begin
 for d in select value from jsonb_array_elements(p_snapshot->'days') loop
  entries:='[]'::jsonb;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   info:=e->'info';if info is null then select to_jsonb(x) into info from public.exercises x where id=e->>'exerciseId';end if;
   if info is null then raise exception 'missing_exercise_snapshot';end if;
   new_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(e->>'exerciseId','sha256'),'hex'),1,16);
   insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
   values(new_id,p_owner,info->>'name',coalesce(info->>'name_ar',info->>'name'),coalesce(info->>'equipment',''),coalesce(info->>'equipment_ar',''),coalesce(info->>'instructions',''),coalesce(info->>'instructions_ar',''),coalesce(info->>'movement','other'),coalesce(info->>'kind',e->>'kind','strength'),info->>'media_url') on conflict(id) do nothing;
   entries:=entries||jsonb_build_array(jsonb_set(e-'info','{exerciseId}',to_jsonb(new_id)));
  end loop;
  days:=days||jsonb_build_array(jsonb_set(d,'{exercises}',entries));
 end loop;
 draft:=jsonb_set(draft,'{days}',days);
 insert into public.plans(id,coach_id,title,draft,team_template_id) values(p_id,p_owner,p_title,draft,p_template) returning * into p;return p;
end $$;
create function public.respond_team_client(p_id uuid,p_revision int,p_accept boolean) returns public.team_clients language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.team_clients; old_rel public.coach_clients; rel public.coach_clients; a public.assignments; p public.plans; v public.plan_versions; new_version uuid; new_assignment uuid;begin
 select * into e from public.team_clients where id=p_id and client_id=auth.uid();
 if not found then raise exception 'forbidden';end if;
 perform id from public.teams where id=e.team_id for update;select * into e from public.team_clients where id=p_id for update;
 if e.revision=p_revision+1 and e.last_response_revision=p_revision and e.last_accept=p_accept then return e;end if;
 if e.revision is distinct from p_revision then raise exception 'conflict';end if;
 if p_accept is null or e.state='closed' or exists(select 1 from public.teams where id=e.team_id and archived) then raise exception 'enrollment_unavailable';end if;
 if e.state='pending' then
  if p_accept then
   perform id from public.coach_clients where id=e.relationship_id and state='active' for update;
   if not found then raise exception 'enrollment_unavailable';end if;
   if not exists(select 1 from public.team_members where team_id=e.team_id and user_id=e.coach_id and state='active') then raise exception 'invalid_coach';end if;
   perform public.require_team_growth(e.team_id,'accept_client');
  end if;
  update public.team_clients set state=case when p_accept then 'active' else 'closed' end,revision=revision+1 where id=p_id returning * into e;
 elsif e.pending_coach_id is not null then
  if p_accept then
   if not exists(select 1 from public.team_members where team_id=e.team_id and user_id=e.pending_coach_id and state='active') then raise exception 'invalid_coach';end if;
   select * into old_rel from public.coach_clients where id=e.relationship_id for update;
   insert into public.coach_clients(coach_id,client_id) values(e.pending_coach_id,e.client_id) on conflict(coach_id,client_id) do update set state='active' returning * into rel;
   if exists(select 1 from public.team_clients where relationship_id=rel.id and state<>'closed' and id<>e.id) then raise exception 'relationship_already_enrolled';end if;
   select * into a from public.assignments where relationship_id=e.relationship_id and state='active' for update;
   if found then
    select * into v from public.plan_versions where id=a.version_id;
    p:=public.copy_snapshot_plan(gen_random_uuid(),e.pending_coach_id,v.title,v.prescription);
    insert into public.plan_versions(plan_id,coach_id,revision,title,prescription) values(p.id,p.coach_id,1,p.title,public.snapshot_prescription(p.draft)) returning id into new_version;
    update public.assignments set state='archived' where relationship_id=rel.id and state='active';
    insert into public.assignments(relationship_id,coach_id,client_id,version_id,start_date,end_date,schedule_mode) values(rel.id,e.pending_coach_id,e.client_id,new_version,a.start_date,a.end_date,a.schedule_mode) returning id into new_assignment;
    insert into public.schedule_exceptions(assignment_id,day_id,scheduled_date,target_date,state) select new_assignment,day_id,scheduled_date,target_date,state from public.schedule_exceptions where assignment_id=a.id;
   end if;
   update public.coach_clients set state='archived' where id=old_rel.id;
   update public.coaching_requests set cancelled=true,revision=revision+1 where relationship_id=old_rel.id and submitted_at is null and not cancelled;
   update public.appointment_slots set state='open' where id in(select slot_id from public.appointments where relationship_id=old_rel.id and state='booked' and starts_at>now());
   update public.appointments set state='cancelled',note='Coach handoff',revision=revision+1 where relationship_id=old_rel.id and state='booked' and starts_at>now();
   update public.team_clients set coach_id=e.pending_coach_id,relationship_id=rel.id where id=p_id;
  end if;
  update public.team_clients set pending_coach_id=null,revision=revision+1 where id=p_id returning * into e;
 else raise exception 'enrollment_unavailable';end if;
 update public.team_clients set last_response_revision=p_revision,last_accept=p_accept where id=p_id returning * into e;
 perform public.team_log(e.team_id,case when p_accept then 'client_accepted' else 'client_declined' end,e.id);return e;
end $$;
create function public.close_team_client(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.team_clients;begin
 select * into e from public.team_clients where id=p_id;perform id from public.teams where id=e.team_id for update;
 select * into e from public.team_clients where id=p_id for update;
 if not found or (auth.uid() is distinct from e.coach_id and auth.uid() is distinct from e.client_id and coalesce(public.team_role(e.team_id),'') not in('owner','admin')) then raise exception 'forbidden';end if;
 if e.state='closed' then return;end if;if e.revision is distinct from p_revision then raise exception 'conflict';end if;
 update public.team_clients set state='closed',pending_coach_id=null,revision=revision+1 where id=p_id;
 delete from public.team_group_members where client_id=p_id;perform public.team_log(e.team_id,'enrollment_closed',p_id);
end $$;
create function public.save_team_group(p_id uuid,p_team uuid,p_name text,p_revision int) returns public.team_groups language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.team_groups;begin
 perform id from public.teams where id=p_team for update;
 if coalesce(public.team_role(p_team),'') not in('owner','admin') then raise exception 'forbidden';end if;
 select * into g from public.team_groups where id=p_id;
 if found and g.team_id<>p_team then raise exception 'forbidden';end if;
 if g.archived then raise exception 'group_unavailable';end if;
 if g.name=trim(p_name) then return g;end if;
 if p_revision is distinct from coalesce(g.revision,0) then raise exception 'conflict';end if;
 insert into public.team_groups(id,team_id,name) values(p_id,p_team,trim(p_name)) on conflict(id) do update set name=excluded.name,revision=team_groups.revision+1 returning * into g;return g;
end $$;
create function public.archive_team_group(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.team_groups;begin
 select * into g from public.team_groups where id=p_id;perform id from public.teams where id=g.team_id for update;
 select * into g from public.team_groups where id=p_id for update;
 if coalesce(public.team_role(g.team_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if g.archived then return;end if;if g.revision is distinct from p_revision then raise exception 'conflict';end if;
 update public.team_groups set archived=true,revision=revision+1 where id=p_id;
 delete from public.team_group_members where group_id=p_id;
 perform public.team_log(g.team_id,'group_archived',p_id);
end $$;
create function public.set_team_group_client(p_group uuid,p_client uuid,p_included boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.team_groups;begin
 select * into g from public.team_groups where id=p_group;perform id from public.teams where id=g.team_id for update;
 if coalesce(public.team_role(g.team_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if g.archived then raise exception 'group_unavailable';end if;
 if not exists(select 1 from public.team_clients where id=p_client and team_id=g.team_id and state='active') or p_included is null then raise exception 'enrollment_unavailable';end if;
 if p_included then insert into public.team_group_members(group_id,client_id) values(p_group,p_client) on conflict do nothing;
 else delete from public.team_group_members where group_id=p_group and client_id=p_client;end if;
end $$;
create function public.share_team_plan(p_id uuid,p_team uuid,p_version uuid) returns public.team_plans language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.team_plans;v public.plan_versions;begin
 perform id from public.teams where id=p_team for update;
 if public.team_role(p_team) is null then raise exception 'forbidden';end if;
 select * into t from public.team_plans where id=p_id;
 if found then if t.team_id<>p_team or t.contributor_id<>auth.uid() or t.source_id is distinct from p_version then raise exception 'conflict';end if;return t;end if;
 perform public.require_team_growth(p_team,'write');select * into v from public.plan_versions where id=p_version and coach_id=auth.uid();
 if not found then raise exception 'forbidden';end if;
 -- Legacy starter versions may lack exercise info. Freeze missing content at sharing,
 -- while preserving info already captured in a real published version.
 select jsonb_set(v.prescription,'{days}',(
  select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((
   select jsonb_agg(e.value||jsonb_build_object('info',coalesce(e.value->'info',to_jsonb(x)-'owner_id'-'revision'-'active')) order by e.n)
   from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n)
   left join public.exercises x on x.id=e.value->>'exerciseId'
  ),'[]'::jsonb)) order by d.n)
  from jsonb_array_elements(v.prescription->'days') with ordinality d(value,n)
 )) into v.prescription;
 insert into public.team_plans(id,team_id,contributor_id,source_id,title,prescription) values(p_id,p_team,auth.uid(),v.id,v.title,v.prescription) returning * into t;
 perform public.team_log(p_team,'plan_shared',t.id);return t;
end $$;
create function public.remove_team_plan(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.team_plans;begin
 select * into t from public.team_plans where id=p_id;perform id from public.teams where id=t.team_id for update;
 if public.team_role(t.team_id) is null or (t.contributor_id is distinct from auth.uid() and public.team_role(t.team_id) not in('owner','admin')) then raise exception 'forbidden';end if;
 update public.team_plans set archived=true where id=p_id;perform public.team_log(t.team_id,'plan_removed',p_id);
end $$;
create function public.import_team_plan(p_id uuid,p_template uuid) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.team_plans;p public.plans;begin
 select * into t from public.team_plans where id=p_template;perform id from public.teams where id=t.team_id for update;
 if public.team_role(t.team_id) is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into p from public.plans where id=p_id;
 if found then if p.coach_id<>auth.uid() or p.team_template_id is distinct from p_template then raise exception 'conflict';end if;return p;end if;
 if t.archived then raise exception 'plan_unavailable';end if;
 p:=public.copy_snapshot_plan(p_id,auth.uid(),t.title,t.prescription,t.id);perform public.team_log(t.team_id,'plan_imported',p.id);return p;
end $$;
create function public.assign_team_group(p_id uuid,p_group uuid,p_version uuid,p_clients uuid[]) returns public.team_assignments language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.team_groups;r public.team_assignments;e public.team_clients;ids uuid[];begin
 select * into g from public.team_groups where id=p_group;perform id from public.teams where id=g.team_id for update;
 if public.team_role(g.team_id) is null then raise exception 'forbidden';end if;
 select array_agg(distinct x order by x) into ids from unnest(p_clients) x;
 select * into r from public.team_assignments where id=p_id;
 if found then if r.actor_id<>auth.uid() or r.group_id<>p_group or r.version_id is distinct from p_version or r.client_ids is distinct from ids then raise exception 'conflict';end if;return r;end if;
 if g.archived then raise exception 'group_unavailable';end if;
 perform public.require_team_growth(g.team_id,'write');
 if coalesce(cardinality(ids),0) not between 1 and 50 or not exists(select 1 from public.plan_versions where id=p_version and coach_id=auth.uid()) then raise exception 'invalid_assignment';end if;
 if exists(select 1 from unnest(ids) x where not exists(select 1 from public.team_clients c join public.team_group_members m on m.client_id=c.id where c.id=x and c.team_id=g.team_id and c.coach_id=auth.uid() and c.state='active' and m.group_id=p_group)) then raise exception 'forbidden';end if;
 for e in select * from public.team_clients where id=any(ids) order by relationship_id loop perform public.assign_plan(e.relationship_id,p_version);end loop;
 insert into public.team_assignments(id,group_id,actor_id,version_id,client_ids) values(p_id,p_group,auth.uid(),p_version,ids) returning * into r;
 perform public.team_log(g.team_id,'group_assigned',r.id);return r;
end $$;
create function public.share_team_resource(p_team uuid,p_resource uuid,p_shared boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 perform id from public.teams where id=p_team for update;
 select * into r from public.resources where id=p_resource for update;
 if not found or (r.owner_id<>auth.uid() and (p_shared or coalesce(public.team_role(p_team),'') not in('owner','admin'))) then raise exception 'forbidden';end if;
 if p_shared is null then raise exception 'invalid_action';end if;
 if p_shared and public.team_role(p_team) is null then raise exception 'forbidden';end if;
 if p_shared then
  perform public.require_team_growth(p_team,'write');if r.state<>'ready' then raise exception 'resource_unavailable';end if;
  insert into public.team_resource_shares(team_id,resource_id) values(p_team,p_resource) on conflict do nothing;
 else delete from public.team_resource_shares where team_id=p_team and resource_id=p_resource;end if;
end $$;
create function public.my_resource_teams() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('resource_id',r.id,'team_id',t.id,'team_name',t.name,'archived',t.archived)),'[]'::jsonb) from public.resources r join public.team_resource_shares s on s.resource_id=r.id join public.teams t on t.id=s.team_id where r.owner_id=auth.uid();
$$;
create or replace function public.can_read_resource(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.resources r where r.id=p_id and (r.owner_id=auth.uid() or (r.state='ready' and (exists(select 1 from public.resource_shares s join public.coach_clients c on c.id=s.relationship_id where s.resource_id=r.id and auth.uid() in(c.coach_id,c.client_id)) or exists(select 1 from public.team_resource_shares s where s.resource_id=r.id and public.team_role(s.team_id) is not null)))));
$$;
create function public.team_workspace(p_team uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare role text:=public.team_role(p_team);begin
 if role is null then raise exception 'forbidden';end if;
 return jsonb_build_object(
 'team',(select to_jsonb(t)||jsonb_build_object('role',role) from public.teams t where id=p_team),
 'members',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('name',p.display_name) order by p.display_name) from public.team_members m join public.profiles p on p.id=m.user_id where m.team_id=p_team and m.state='active'),'[]'::jsonb),
 'invitations',case when role in('owner','admin') then coalesce((select jsonb_agg(to_jsonb(i)-'token_hash' order by expires_at desc) from public.team_invitations i where team_id=p_team and state='pending' and expires_at>now()),'[]'::jsonb) else '[]'::jsonb end,
 'clients',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('name',p.display_name,'coach_name',q.display_name,'pending_name',n.display_name) order by p.display_name) from public.team_clients c join public.profiles p on p.id=c.client_id left join public.profiles q on q.id=c.coach_id left join public.profiles n on n.id=c.pending_coach_id where c.team_id=p_team and c.state<>'closed' and (role in('owner','admin') or auth.uid()=c.coach_id)),'[]'::jsonb),
 'groups',coalesce((select jsonb_agg(to_jsonb(g) order by name) from public.team_groups g where team_id=p_team and not archived),'[]'::jsonb),
 'group_members',coalesce((select jsonb_agg(to_jsonb(m)) from public.team_group_members m join public.team_groups g on g.id=m.group_id join public.team_clients c on c.id=m.client_id where g.team_id=p_team and (role in('owner','admin') or auth.uid()=c.coach_id)),'[]'::jsonb),
 'plans',coalesce((select jsonb_agg(to_jsonb(p)-'prescription' order by created_at desc) from public.team_plans p where team_id=p_team and not archived),'[]'::jsonb),
 'resources',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.resources r join public.team_resource_shares s on s.resource_id=r.id where s.team_id=p_team and r.state='ready'),'[]'::jsonb),
 'activity',case when role in('owner','admin') then coalesce((select jsonb_agg(to_jsonb(a)) from (select * from public.team_activity where team_id=p_team order by created_at desc limit 30) a),'[]'::jsonb) else '[]'::jsonb end);
end $$;
create function public.my_team_enrollments() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('team_name',t.name,'coach_name',p.display_name,'pending_name',q.display_name) order by c.created_at desc),'[]'::jsonb) from public.team_clients c join public.teams t on t.id=c.team_id left join public.profiles p on p.id=c.coach_id left join public.profiles q on q.id=c.pending_coach_id where c.client_id=auth.uid() and c.state<>'closed' and not t.archived;
$$;
-- Only scoped data is directly readable. Sensitive coaching policies stay unchanged.
alter table public.teams enable row level security;
create policy teams_members on public.teams for select to authenticated using(public.team_role(id) is not null);
alter table public.team_members enable row level security;
create policy members_team on public.team_members for select to authenticated using(public.team_role(team_id) is not null);
alter table public.team_invitations enable row level security;
create policy invites_admin on public.team_invitations for select to authenticated using(public.team_role(team_id) in('owner','admin'));
alter table public.team_clients enable row level security;
create policy clients_scoped on public.team_clients for select to authenticated using(client_id=auth.uid() or (public.team_role(team_id) is not null and (coach_id=auth.uid() or public.team_role(team_id) in('owner','admin'))));
alter table public.team_groups enable row level security;
create policy groups_team on public.team_groups for select to authenticated using(public.team_role(team_id) is not null);
alter table public.team_group_members enable row level security;
create policy group_members_scoped on public.team_group_members for select to authenticated using(exists(select 1 from public.team_clients c where c.id=client_id and public.team_role(c.team_id) is not null and (c.coach_id=auth.uid() or public.team_role(c.team_id) in('owner','admin'))));
alter table public.team_plans enable row level security;
create policy plans_team on public.team_plans for select to authenticated using(public.team_role(team_id) is not null);
alter table public.team_resource_shares enable row level security;
create policy resource_team on public.team_resource_shares for select to authenticated using(public.team_role(team_id) is not null);
alter table public.team_assignments enable row level security;
create policy group_assignments_scoped on public.team_assignments for select to authenticated using(actor_id=auth.uid() or exists(select 1 from public.team_groups g where g.id=group_id and public.team_role(g.team_id) in('owner','admin')));
alter table public.team_activity enable row level security;
create policy activity_admin on public.team_activity for select to authenticated using(public.team_role(team_id) in('owner','admin'));
revoke all on public.teams,public.team_members,public.team_invitations,public.team_clients,public.team_groups,public.team_group_members,public.team_plans,public.team_resource_shares,public.team_assignments,public.team_activity from anon,authenticated;
grant select on public.teams,public.team_members,public.team_invitations,public.team_clients,public.team_groups,public.team_group_members,public.team_plans,public.team_resource_shares,public.team_assignments,public.team_activity to authenticated;

do $$ declare f record;begin
 for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in('team_role','team_log','create_team','invite_team_member','team_invitation','accept_team_invitation','revoke_team_invitation','change_team_member','rename_team','close_team','propose_team_client','request_team_handoff','copy_snapshot_plan','respond_team_client','close_team_client','save_team_group','archive_team_group','set_team_group_client','share_team_plan','remove_team_plan','import_team_plan','assign_team_group','share_team_resource','my_resource_teams','can_read_resource','team_workspace','my_team_enrollments') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname not in('team_log','require_team_growth','apply_business_event','operator_support_reply','copy_snapshot_plan') then execute format('grant execute on function %s to authenticated',f.signature);end if;
 end loop;
end $$;
grant execute on function public.team_invitation(text) to anon;

-- Handoff cannot invalidate retrying a session that already started.
create or replace function public.start_session(p_id uuid,p_version_id uuid,p_day_id text,p_assignment_id uuid default null,p_scheduled_date date default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.plan_versions; a public.assignments; d jsonb; e jsonb; s public.sessions; local_day date; preferred_unit text; occurrence text; c public.coach_clients; target jsonb; scheduled date; projection jsonb;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  -- Recover an acknowledged-in-the-database start even if a handoff/archive followed it.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,2));
  select * into s from public.sessions where id=p_id;
  if found then
    if s.client_id<>auth.uid() then raise exception 'forbidden';end if;
    if s.day_id is distinct from p_day_id or (s.version_id is not null and s.version_id is distinct from p_version_id) or (s.assignment_id is not null and s.assignment_id is distinct from p_assignment_id) then raise exception 'conflict';end if;
    return public.session_document(s.id);
  end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=auth.uid();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select c0.* into c from public.coach_clients c0 join public.assignments a0 on a0.relationship_id=c0.id where a0.id=p_assignment_id and a0.client_id=auth.uid() for update of c0;
    if not found or c.state<>'active' then raise exception 'assignment_unavailable'; end if;
    select * into a from public.assignments where id=p_assignment_id and client_id=auth.uid() and state='active' for update;
    if not found or (a.start_date>local_day or a.end_date<local_day) then raise exception 'assignment_unavailable'; end if;
    -- The server selects the assignment's authoritative revision; a stale client must reload it.
    if a.version_id<>p_version_id then raise exception 'plan_changed'; end if;
  end if;
  select * into v from public.plan_versions where id=p_version_id;
  if not found or (p_assignment_id is null and not v.is_public) then raise exception 'forbidden'; end if;
  select value into d from jsonb_array_elements(v.prescription->'days') where value->>'id'=p_day_id;
  if d is null or coalesce((d->>'restDay')::boolean,false) then raise exception 'invalid_day'; end if;
  -- Older shared starter versions predate catalog snapshots; freeze their content at start.
  d:=jsonb_set(d,'{exercises}',(select jsonb_agg(e.value||jsonb_build_object('info',coalesce(e.value->'info',to_jsonb(x)-'owner_id'-'revision'-'active')) order by e.n) from jsonb_array_elements(d->'exercises') with ordinality e(value,n) left join public.exercises x on x.id=e.value->>'exerciseId'));
  scheduled:=local_day;
  if a.schedule_mode='cycle' then
    scheduled:=coalesce(p_scheduled_date,local_day);
    select value into projection from jsonb_array_elements(public.assignment_schedule(a.id,local_day,local_day)) where value->>'scheduled_date'=scheduled::text and value->'day'->>'id'=p_day_id and value->>'state' not in('skipped','rest');
    if projection is null then raise exception 'assignment_unavailable'; end if;
  end if;
  occurrence := case when a.id is not null then a.id::text||':'||scheduled::text||':'||p_day_id else 'sample:'||p_id::text end;
  insert into public.sessions(id,client_id,coach_id,assignment_id,version_id,day_id,occurrence_key,local_date,title,prescription)
    values(p_id,auth.uid(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=auth.uid() and occurrence_key=occurrence; end if;
  for e in select value from jsonb_array_elements(s.prescription->'exercises') loop
    for n in 0..(e->>'sets')::int-1 loop
      target:=coalesce(e->'targets'->n,e);
      insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit,seconds,metres,effort)
        values(s.id,e->>'key',n,(target->>'reps')::int,round((target->>'load')::numeric * case when preferred_unit=e->>'unit' then 1 when preferred_unit='lb' then 2.2046226218 else 1/2.2046226218 end,2),preferred_unit,(target->>'seconds')::int,(target->>'metres')::numeric,null) on conflict do nothing;
    end loop;
  end loop;
  return public.session_document(s.id);
end $$;
