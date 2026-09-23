-- Provider state is separate from training. Local simulations default off on new hosting.
create table public.runtime_settings(id boolean primary key default true check(id),local_simulation boolean not null default false);
insert into public.runtime_settings(id) values(true);
alter table public.runtime_settings enable row level security;
revoke all on public.runtime_settings from public,anon,authenticated;
create table public.business_accounts (
 id uuid primary key,owner_id uuid references public.profiles(id) on delete cascade,team_id uuid references public.teams(id) on delete cascade,
 state text not null default 'trial' check(state in('trial','active','past_due','cancelled')),access_until timestamptz not null default now()+interval '14 days',
 staff_limit int not null default 10 check(staff_limit between 1 and 1000),client_limit int not null default 50 check(client_limit between 1 and 100000),
 provider_sequence bigint not null default 0,updated_at timestamptz not null default now(),check((owner_id is null)<>(team_id is null)),unique(owner_id),unique(team_id)
);
create table public.business_events (
 id uuid primary key,account_id uuid not null references public.business_accounts(id) on delete cascade,
 sequence bigint not null check(sequence>0),payload jsonb not null,applied boolean not null,created_at timestamptz not null default now(),unique(account_id,sequence)
);
create table public.support_cases (
 id uuid primary key,reporter_id uuid not null references public.profiles(id) on delete cascade,team_id uuid references public.teams(id) on delete set null,
 subject text not null check(char_length(subject) between 1 and 120),detail text not null check(char_length(detail) between 1 and 4000),
 state text not null default 'open' check(state in('open','resolved')),reply text not null default '',revision int not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create function public.business_access(p_account uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.business_accounts where id=p_account and (owner_id=auth.uid() or public.team_role(team_id) in('owner','admin')));
$$;
create function public.open_business_account(p_id uuid,p_team uuid default null) returns public.business_accounts language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.business_accounts;begin
 if auth.uid() is null or (p_team is not null and public.team_role(p_team)<>'owner') then raise exception 'forbidden';end if;
 if p_team is not null and public.team_role(p_team) is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(p_team,auth.uid())::text,1));
 select * into a from public.business_accounts where (p_team is null and owner_id=auth.uid()) or team_id=p_team;
 if found then return a;end if;
 insert into public.business_accounts(id,owner_id,team_id) values(p_id,case when p_team is null then auth.uid() end,p_team) returning * into a;return a;
end $$;
create function public.require_team_growth(p_team uuid,p_action text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.business_accounts; n int;begin
 select * into a from public.business_accounts where team_id=p_team for update;
 if not found or a.state not in('trial','active') or a.access_until<=now() then raise exception 'commercial_restricted';end if;
 if p_action in('staff','accept_staff') then
  select count(*) into n from public.team_members where team_id=p_team and state='active';
  if p_action='staff' then n:=n+(select count(*) from public.team_invitations where team_id=p_team and state='pending' and expires_at>now());end if;
  if n>=a.staff_limit then raise exception 'staff_limit';end if;
 elsif p_action in('client','accept_client') then
  select count(*) into n from public.team_clients where team_id=p_team and (state='active' or (state='pending' and p_action='client'));
  if n>=a.client_limit then raise exception 'client_limit';end if;
 end if;
end $$;
create function public.apply_business_event(p_id uuid,p_account uuid,p_sequence bigint,p_payload jsonb) returns public.business_accounts language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.business_accounts;e public.business_events;until_date timestamptz;begin
 select * into a from public.business_accounts where id=p_account for update;if not found then raise exception 'account_unavailable';end if;
 select * into e from public.business_events where id=p_id;
 if found then if e.account_id<>p_account or e.sequence<>p_sequence or e.payload is distinct from p_payload then raise exception 'conflict';end if;return a;end if;
 if p_sequence is null or p_sequence<1 or jsonb_typeof(p_payload) is distinct from 'object' or coalesce(p_payload->>'state','') not in('trial','active','past_due','cancelled')
 or coalesce((p_payload->>'staff_limit')::int,0) not between 1 and 1000 or coalesce((p_payload->>'client_limit')::int,0) not between 1 and 100000 then raise exception 'invalid_provider_event';end if;
 until_date:=(p_payload->>'access_until')::timestamptz;if until_date is null then raise exception 'invalid_provider_event';end if;
 insert into public.business_events(id,account_id,sequence,payload,applied) values(p_id,p_account,p_sequence,p_payload,p_sequence>a.provider_sequence);
 if p_sequence>a.provider_sequence then
  update public.business_accounts set state=p_payload->>'state',access_until=until_date,staff_limit=(p_payload->>'staff_limit')::int,client_limit=(p_payload->>'client_limit')::int,provider_sequence=p_sequence,updated_at=now() where id=p_account returning * into a;
 end if;return a;
end $$;
create function public.simulate_business_event(p_id uuid,p_account uuid,p_sequence bigint,p_payload jsonb) returns public.business_accounts language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.business_accounts;begin
 if not exists(select 1 from public.runtime_settings where local_simulation) then raise exception 'simulation_disabled';end if;
 select * into a from public.business_accounts where id=p_account;
 if not found or not (coalesce(a.owner_id=auth.uid(),false) or coalesce(public.team_role(a.team_id),'')='owner') then raise exception 'forbidden';end if;
 return public.apply_business_event(p_id,p_account,p_sequence,p_payload);
end $$;
create function public.create_support_case(p_id uuid,p_team uuid,p_subject text,p_detail text) returns public.support_cases language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_cases;begin
 if auth.uid() is null then raise exception 'forbidden';end if;
 if p_team is not null and public.team_role(p_team) is null and not exists(select 1 from public.team_clients where team_id=p_team and client_id=auth.uid() and state='active') then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into c from public.support_cases where id=p_id;
 if found then if c.reporter_id<>auth.uid() or c.team_id is distinct from p_team or c.subject is distinct from trim(p_subject) or c.detail is distinct from trim(p_detail) then raise exception 'conflict';end if;return c;end if;
 insert into public.support_cases(id,reporter_id,team_id,subject,detail) values(p_id,auth.uid(),p_team,trim(p_subject),trim(p_detail)) returning * into c;return c;
end $$;
create function public.update_support_case(p_id uuid,p_revision int,p_state text,p_reply text default null) returns public.support_cases language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_cases;begin
 select * into c from public.support_cases where id=p_id for update;
 if not found or (c.reporter_id<>auth.uid() and coalesce(public.team_role(c.team_id),'') not in('owner','admin')) then raise exception 'forbidden';end if;
 if p_reply is not null and coalesce(public.team_role(c.team_id),'') not in('owner','admin') then raise exception 'forbidden';end if;
 if c.state=p_state and (p_reply is null or c.reply=p_reply) then return c;end if;
 if c.revision is distinct from p_revision then raise exception 'conflict';end if;
 if coalesce(p_state,'') not in('open','resolved') or char_length(coalesce(p_reply,''))>4000 then raise exception 'invalid_support';end if;
 update public.support_cases set state=p_state,reply=coalesce(p_reply,reply),revision=revision+1,updated_at=now() where id=p_id returning * into c;return c;
end $$;
create function public.operator_support_reply(p_id uuid,p_revision int,p_reply text) returns public.support_cases language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_cases;begin
 select * into c from public.support_cases where id=p_id for update;
 if not found then raise exception 'case_unavailable';end if;
 if c.reply=p_reply and c.state='resolved' then return c;end if;
 if c.revision is distinct from p_revision then raise exception 'conflict';end if;
 if char_length(trim(coalesce(p_reply,''))) not between 1 and 4000 then raise exception 'invalid_support';end if;
 update public.support_cases set reply=p_reply,state='resolved',revision=revision+1,updated_at=now() where id=p_id returning * into c;return c;
end $$;
create function public.account_deletion_ready() returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'unauthenticated';end if;
 if exists(select 1 from public.teams where owner_id=auth.uid() and not archived) then raise exception 'transfer_owner_first';end if;
 if exists(select 1 from public.team_clients where state<>'closed' and (coach_id=auth.uid() or pending_coach_id=auth.uid())) then raise exception 'reassign_clients_first';end if;
end $$;
create or replace function public.delete_my_account(p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation';end if;
 -- Teams are locked before profile locks, matching team commands' lock order.
 perform id from public.teams where id in(select team_id from public.team_members where user_id=auth.uid()) order by id for update;
 perform public.account_deletion_ready();
 perform id from public.profiles where id=auth.uid() for update;
 if exists(select 1 from public.resources where owner_id=auth.uid()) then raise exception 'file_cleanup_required';end if;
 update public.appointment_slots set state='open' where starts_at>now() and id in(select a.slot_id from public.appointments a join public.coach_clients c on c.id=a.relationship_id where c.client_id=auth.uid() and a.state='booked');
 delete from auth.users where id=auth.uid();
end $$;
alter table public.business_accounts enable row level security;
create policy business_owner on public.business_accounts for select to authenticated using(public.business_access(id));
alter table public.business_events enable row level security;
create policy events_owner on public.business_events for select to authenticated using(public.business_access(account_id));
alter table public.support_cases enable row level security;
create policy support_participants on public.support_cases for select to authenticated using(reporter_id=auth.uid() or public.team_role(team_id) in('owner','admin'));
revoke all on public.business_accounts,public.business_events,public.support_cases from anon,authenticated;
grant select on public.business_accounts,public.business_events,public.support_cases to authenticated;

do $$ declare f record;begin
 for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in('business_access','open_business_account','require_team_growth','apply_business_event','simulate_business_event','create_support_case','update_support_case','operator_support_reply','account_deletion_ready','delete_my_account') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname not in('team_log','require_team_growth','apply_business_event','operator_support_reply','copy_snapshot_plan') then execute format('grant execute on function %s to authenticated',f.signature);end if;
 end loop;
end $$;
grant execute on function public.apply_business_event(uuid,uuid,bigint,jsonb),public.operator_support_reply(uuid,int,text) to service_role;
