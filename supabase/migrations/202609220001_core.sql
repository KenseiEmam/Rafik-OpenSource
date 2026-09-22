-- Fresh Rafik domain. No legacy schema, broad workflow triggers, or external calls.
create extension if not exists pgcrypto with schema extensions;
revoke create on schema public from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  locale text not null default 'en' check (locale in ('en','ar')),
  units text not null default 'kg' check (units in ('kg','lb')),
  timezone text not null default 'Asia/Dubai',
  created_at timestamptz not null default now()
);
create table public.exercises (
  id text primary key, name text not null, name_ar text not null,
  equipment text not null, equipment_ar text not null,
  instructions text not null, instructions_ar text not null,
  movement text not null, active boolean not null default true
);
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  draft jsonb not null, draft_version integer not null default 1,
  archived boolean not null default false,
  updated_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  revision integer not null, title text not null, prescription jsonb not null,
  is_public boolean not null default false, published_at timestamptz not null default now(),
  unique(plan_id, revision)
);
create table public.coach_clients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  state text not null default 'active' check (state in ('active','archived')),
  created_at timestamptz not null default now(),
  unique(coach_id,client_id), check (coach_id <> client_id)
);
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_clients(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  version_id uuid not null references public.plan_versions(id),
  start_date date not null default current_date,
  state text not null default 'active' check (state in ('active','archived')),
  created_at timestamptz not null default now()
);
create unique index one_active_assignment on public.assignments(relationship_id) where state='active';
create index assignments_client on public.assignments(client_id,state);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  intended_email text not null, version_id uuid not null references public.plan_versions(id),
  token_hash text not null unique, request_id uuid not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  accepted_by uuid references public.profiles(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  expires_at timestamptz not null default now()+interval '7 days',
  created_at timestamptz not null default now(), unique(coach_id,request_id)
);
create table public.sessions (
  id uuid primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id) on delete set null,
  assignment_id uuid references public.assignments(id) on delete set null,
  version_id uuid references public.plan_versions(id) on delete set null,
  day_id text not null, occurrence_key text not null, local_date date not null,
  title text not null, prescription jsonb not null,
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  note text not null default '' check(char_length(note)<=2000),
  coach_note text not null default '' check(char_length(coach_note)<=2000),
  reviewed_at timestamptz, started_at timestamptz not null default now(), completed_at timestamptz,
  version integer not null default 1,
  unique(client_id,occurrence_key),
  check ((status='completed')=(completed_at is not null))
);
create index sessions_coach_review on public.sessions(coach_id,completed_at desc) where status='completed';
create index sessions_client_history on public.sessions(client_id,started_at desc);
create table public.set_entries (
  session_id uuid not null references public.sessions(id) on delete cascade,
  exercise_key text not null, set_index integer not null check(set_index between 0 and 19),
  reps integer not null check(reps between 0 and 200),
  load numeric(8,2) not null check(load between 0 and 1000),
  unit text not null check(unit in ('kg','lb')), completed boolean not null default false,
  primary key(session_id,exercise_key,set_index)
);
create table public.session_operations (
  session_id uuid not null references public.sessions(id) on delete cascade,
  operation_id uuid not null, request_hash text not null, result jsonb not null,
  created_at timestamptz not null default now(), primary key(session_id,operation_id)
);

-- Validate one bounded, explicit prescription format rather than arbitrary nested form data.
create function public.validate_prescription(p jsonb) returns void
language plpgsql set search_path = public, pg_temp as $$
declare d jsonb; e jsonb; day_ids text[] := '{}'; keys text[];
begin
  if jsonb_typeof(p) is distinct from 'object' or p->>'schema' is distinct from '1'
    or jsonb_typeof(p->'days') is distinct from 'array' then raise exception 'invalid_plan'; end if;
  if jsonb_array_length(p->'days') not between 1 and 7 then raise exception 'invalid_day_count'; end if;
  for d in select value from jsonb_array_elements(p->'days') loop
    if nullif(d->>'id','') is null or d->>'id'=any(day_ids) or char_length(coalesce(d->>'name','')) not between 1 and 80
      or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'invalid_day'; end if;
    day_ids := array_append(day_ids,d->>'id'); keys := '{}';
    if jsonb_array_length(d->'exercises') not between 1 and 12 then raise exception 'invalid_exercise_count'; end if;
    for e in select value from jsonb_array_elements(d->'exercises') loop
      if nullif(e->>'key','') is null or e->>'key'=any(keys)
        or not exists(select 1 from public.exercises x where x.id=e->>'exerciseId' and x.active)
        or coalesce((e->>'sets')::int,0) not between 1 and 10
        or coalesce((e->>'reps')::int,0) not between 1 and 100
        or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
        or coalesce(e->>'unit','') not in ('kg','lb')
        or coalesce((e->>'rest')::int,-1) not between 0 and 600
        or char_length(coalesce(e->>'note',''))>500 then raise exception 'invalid_exercise'; end if;
      keys := array_append(keys,e->>'key');
    end loop;
  end loop;
end $$;

create function public.ensure_profile(p_name text default null,p_locale text default 'en',p_timezone text default 'UTC') returns public.profiles
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.profiles;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone'; end if;
  insert into public.profiles(id,display_name,locale,timezone) values(auth.uid(),left(coalesce(nullif(trim(p_name),''),nullif(split_part(auth.jwt()->>'email','@',1),''),'Your name'),80),p_locale,p_timezone)
    on conflict(id) do nothing;
  select * into r from public.profiles where id=auth.uid(); return r;
end $$;
create function public.update_profile(p_name text,p_locale text,p_units text,p_timezone text) returns public.profiles
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.profiles;
begin
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone'; end if;
  update public.profiles set display_name=trim(p_name),locale=p_locale,units=p_units,timezone=p_timezone where id=auth.uid() returning * into r;
  if not found then raise exception 'unauthenticated'; end if; return r;
end $$;

create function public.save_plan(p_id uuid,p_title text,p_draft jsonb,p_expected_version integer default null) returns public.plans
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.plans;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  perform public.validate_prescription(p_draft);
  if p_expected_version is null then
    insert into public.plans(id,coach_id,title,draft) values(p_id,auth.uid(),trim(p_title),p_draft)
      on conflict(id) do nothing returning * into r;
    if not found then
      select * into r from public.plans where id=p_id and coach_id=auth.uid();
      if not found then raise exception 'forbidden'; end if;
      if r.title is distinct from trim(p_title) or r.draft is distinct from p_draft then raise exception 'conflict'; end if;
    end if;
  else
    select * into r from public.plans where id=p_id and coach_id=auth.uid() and not archived for update;
    if not found then raise exception 'forbidden'; end if;
    -- A lost acknowledgment can be retried without creating a new draft revision.
    if r.title=trim(p_title) and r.draft=p_draft and r.draft_version in (p_expected_version,p_expected_version+1) then return r; end if;
    update public.plans set title=trim(p_title),draft=p_draft,draft_version=draft_version+1,updated_at=now()
      where id=p_id and coach_id=auth.uid() and draft_version=p_expected_version and not archived returning * into r;
    if not found then raise exception 'conflict'; end if;
  end if; return r;
end $$;
create function public.publish_plan(p_id uuid,p_expected_version integer) returns public.plan_versions
language plpgsql security definer set search_path = public, pg_temp as $$
declare p public.plans; v public.plan_versions;
begin
  select * into p from public.plans where id=p_id and coach_id=auth.uid() and not archived for update;
  if not found then raise exception 'forbidden'; end if;
  if p_expected_version is null or p.draft_version<>p_expected_version then raise exception 'conflict'; end if;
  perform public.validate_prescription(p.draft);
  select * into v from public.plan_versions where plan_id=p_id and revision=p.draft_version;
  if found then return v; end if;
  insert into public.plan_versions(plan_id,coach_id,revision,title,prescription) values(p.id,p.coach_id,p.draft_version,p.title,p.draft) returning * into v;
  return v;
end $$;
create function public.create_invitation(p_email text,p_version_id uuid,p_token text,p_request_id uuid) returns public.invitations
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare r public.invitations;
begin
  if not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=auth.uid()) then raise exception 'forbidden'; end if;
  if char_length(p_token)<40 or char_length(p_token)>100 or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(p_email)>254 then raise exception 'invalid_invitation'; end if;
  insert into public.invitations(coach_id,intended_email,version_id,token_hash,request_id)
    values(auth.uid(),lower(trim(p_email)),p_version_id,encode(digest(p_token,'sha256'),'hex'),p_request_id)
    on conflict(coach_id,request_id) do nothing returning * into r;
  if not found then
    select * into r from public.invitations where coach_id=auth.uid() and request_id=p_request_id;
    if r.token_hash<>encode(digest(p_token,'sha256'),'hex') or r.intended_email<>lower(trim(p_email)) or r.version_id<>p_version_id then raise exception 'conflict'; end if;
  end if; return r;
end $$;
create function public.get_invitation(p_token text) returns jsonb
language sql stable security definer set search_path = public, extensions, pg_temp as $$
  select jsonb_build_object('coach_name',p.display_name,'status',case when i.status='pending' and i.expires_at<now() then 'expired' else i.status end,'expires_at',i.expires_at)
  from public.invitations i join public.profiles p on p.id=i.coach_id
  where i.token_hash=encode(digest(p_token,'sha256'),'hex');
$$;
create function public.accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare i public.invitations; u auth.users; rel uuid; a uuid;
begin
  select * into u from auth.users where id=auth.uid();
  if not found or u.email_confirmed_at is null then raise exception 'verify_email'; end if;
  select * into i from public.invitations where token_hash=encode(digest(p_token,'sha256'),'hex') for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if lower(u.email)<>i.intended_email then raise exception 'wrong_email'; end if;
  if i.status='accepted' and i.accepted_by=u.id then return i.assignment_id; end if;
  if i.status<>'pending' or i.expires_at<now() then raise exception 'invitation_unavailable'; end if;
  if i.coach_id=u.id then raise exception 'cannot_invite_yourself'; end if;
  perform public.ensure_profile();
  insert into public.coach_clients(coach_id,client_id) values(i.coach_id,u.id)
    on conflict(coach_id,client_id) do update set state='active' returning id into rel;
  update public.assignments set state='archived' where relationship_id=rel and state='active';
  insert into public.assignments(relationship_id,coach_id,client_id,version_id) values(rel,i.coach_id,u.id,i.version_id) returning id into a;
  update public.invitations set status='accepted',accepted_by=u.id,assignment_id=a where id=i.id;
  return a;
end $$;
create function public.revoke_invitation(p_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.invitations set status='revoked' where id=p_id and coach_id=auth.uid() and status='pending';
  if not found then raise exception 'invitation_unavailable'; end if;
end $$;
create function public.assign_plan(p_relationship_id uuid,p_version_id uuid) returns public.assignments
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.coach_clients; a public.assignments;
begin
  select * into c from public.coach_clients where id=p_relationship_id and coach_id=auth.uid() and state='active' for update;
  if not found or not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=auth.uid()) then raise exception 'forbidden'; end if;
  select * into a from public.assignments where relationship_id=c.id and state='active';
  if found then
    update public.assignments set version_id=p_version_id where id=a.id returning * into a;
  else
    insert into public.assignments(relationship_id,coach_id,client_id,version_id) values(c.id,c.coach_id,c.client_id,p_version_id) returning * into a;
  end if; return a;
end $$;

create function public.session_document(p_id uuid) returns jsonb
language sql stable set search_path = public, pg_temp as $$
 select to_jsonb(s)||jsonb_build_object('entries',coalesce((select jsonb_agg(to_jsonb(e) - 'session_id' order by exercise_key,set_index) from public.set_entries e where e.session_id=s.id),'[]'::jsonb))
 from public.sessions s where s.id=p_id;
$$;
create function public.start_session(p_id uuid,p_version_id uuid,p_day_id text,p_assignment_id uuid default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.plan_versions; a public.assignments; d jsonb; e jsonb; s public.sessions; local_day date; preferred_unit text; occurrence text; n int;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=auth.uid();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select * into a from public.assignments where id=p_assignment_id and client_id=auth.uid() and state='active';
    if not found or a.start_date>local_day then raise exception 'assignment_unavailable'; end if;
    -- The server selects the assignment's authoritative revision; a stale client must reload it.
    if a.version_id<>p_version_id then raise exception 'plan_changed'; end if;
  end if;
  select * into v from public.plan_versions where id=p_version_id;
  if not found or (p_assignment_id is null and not v.is_public) then raise exception 'forbidden'; end if;
  select value into d from jsonb_array_elements(v.prescription->'days') where value->>'id'=p_day_id;
  if d is null then raise exception 'invalid_day'; end if;
  occurrence := case when a.id is not null then a.id::text||':'||local_day::text||':'||p_day_id else 'sample:'||p_id::text end;
  insert into public.sessions(id,client_id,coach_id,assignment_id,version_id,day_id,occurrence_key,local_date,title,prescription)
    values(p_id,auth.uid(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=auth.uid() and occurrence_key=occurrence; end if;
  for e in select value from jsonb_array_elements(s.prescription->'exercises') loop
    for n in 0..(e->>'sets')::int-1 loop
      insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit)
        values(s.id,e->>'key',n,(e->>'reps')::int,round((e->>'load')::numeric * case when preferred_unit=e->>'unit' then 1 when preferred_unit='lb' then 2.2046226218 else 1/2.2046226218 end,2),preferred_unit) on conflict do nothing;
    end loop;
  end loop;
  return public.session_document(s.id);
end $$;
create function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int;
begin
  select * into s from public.sessions where id=p_id and client_id=auth.uid() for update;
  if not found then raise exception 'forbidden'; end if;
  h:=encode(digest(jsonb_build_object('entries',p_entries,'note',p_note,'complete',p_complete,'version',p_expected_version)::text,'sha256'),'hex');
  select * into op from public.session_operations where session_id=p_id and operation_id=p_operation_id;
  if found then
    if op.request_hash<>h then raise exception 'operation_reused'; end if;
    return op.result;
  end if;
  if p_expected_version is null or s.version<>p_expected_version then raise exception 'conflict'; end if;
  if jsonb_typeof(p_entries) is distinct from 'array' or p_note is null or char_length(p_note)>2000 then raise exception 'invalid_session'; end if;
  select count(*) into expected_count from public.set_entries where session_id=p_id;
  if jsonb_array_length(p_entries)<>expected_count or (select count(distinct (x->>'exercise_key',x->>'set_index')) from jsonb_array_elements(p_entries) x)<>expected_count then raise exception 'invalid_entries'; end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    if not exists(select 1 from public.set_entries where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int)
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or ((e->>'completed')::boolean and (e->>'reps')::int<1) then raise exception 'invalid_entry'; end if;
    update public.set_entries set reps=(e->>'reps')::int,load=(e->>'load')::numeric,unit=e->>'unit',completed=(e->>'completed')::boolean
      where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int;
  end loop;
  if p_complete and not exists(select 1 from public.set_entries where session_id=p_id and completed) then raise exception 'no_completed_sets'; end if;
  update public.sessions set note=p_note,version=version+1,
    status=case when p_complete then 'completed' else status end,
    completed_at=case when p_complete then coalesce(completed_at,now()) else completed_at end
    where id=p_id;
  result:=public.session_document(p_id);
  insert into public.session_operations(session_id,operation_id,request_hash,result) values(p_id,p_operation_id,h,result);
  return result;
end $$;
create function public.review_session(p_id uuid,p_note text) returns public.sessions
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.sessions;
begin
  update public.sessions set coach_note=trim(p_note),reviewed_at=now() where id=p_id and coach_id=auth.uid() and status='completed' returning * into s;
  if not found then raise exception 'forbidden'; end if; return s;
end $$;

-- Queries remain simple; writes use the small command surface above.
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.coach_clients enable row level security;
alter table public.assignments enable row level security;
alter table public.invitations enable row level security;
alter table public.sessions enable row level security;
alter table public.set_entries enable row level security;
alter table public.session_operations enable row level security;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or exists(select 1 from public.coach_clients c where (c.client_id=profiles.id and c.coach_id=auth.uid()) or (c.coach_id=profiles.id and c.client_id=auth.uid())));
create policy catalog_read on public.exercises for select to anon,authenticated using(active);
create policy own_plans on public.plans for select to authenticated using(coach_id=auth.uid());
create policy public_sample_read on public.plan_versions for select to anon,authenticated using(is_public);
create policy published_read on public.plan_versions for select to authenticated using(coach_id=auth.uid() or exists(select 1 from public.assignments a where a.version_id=plan_versions.id and a.client_id=auth.uid()) or exists(select 1 from public.sessions s where s.version_id=plan_versions.id and s.client_id=auth.uid()));
create policy relationship_read on public.coach_clients for select to authenticated using(coach_id=auth.uid() or client_id=auth.uid());
create policy assignment_read on public.assignments for select to authenticated using(coach_id=auth.uid() or client_id=auth.uid());
create policy invitation_read on public.invitations for select to authenticated using(coach_id=auth.uid());
create policy session_read on public.sessions for select to authenticated using(client_id=auth.uid() or coach_id=auth.uid());
create policy entries_read on public.set_entries for select to authenticated using(exists(select 1 from public.sessions s where s.id=set_entries.session_id and (s.client_id=auth.uid() or s.coach_id=auth.uid())));
-- No client reads/writes the idempotency ledger directly.
revoke all on all tables in schema public from anon,authenticated;
grant select on public.exercises,public.plan_versions to anon,authenticated;
grant select on public.profiles,public.plans,public.coach_clients,public.assignments,public.invitations,public.sessions,public.set_entries to authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
grant execute on function public.get_invitation(text) to anon,authenticated;
grant execute on function public.ensure_profile(text,text,text),public.update_profile(text,text,text,text),public.save_plan(uuid,text,jsonb,integer),public.publish_plan(uuid,integer),public.create_invitation(text,uuid,text,uuid),public.accept_invitation(text),public.revoke_invitation(uuid),public.assign_plan(uuid,uuid),public.session_document(uuid),public.start_session(uuid,uuid,text,uuid),public.save_session(uuid,integer,uuid,jsonb,text,boolean),public.review_session(uuid,text) to authenticated;

-- Deleting a coach removes their plans and relationships, but other clients retain
-- their own session snapshots. Deleting a client removes that client's results.
create function public.delete_my_account(p_confirmation text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation'; end if;
  delete from auth.users where id=auth.uid();
end $$;
revoke all on function public.delete_my_account(text) from public,anon;
grant execute on function public.delete_my_account(text) to authenticated;
