-- R7 domain port; PostgreSQL-owned identity context and private file metadata.
create schema identity;
create schema file_store;
create schema extensions;
do $$ begin if not exists(select 1 from pg_roles where rolname='rafik_guest') then create role rafik_guest nologin; end if; end $$;
do $$ begin if not exists(select 1 from pg_roles where rolname='rafik_user') then create role rafik_user nologin; end if; end $$;
do $$ begin if not exists(select 1 from pg_roles where rolname='rafik_service') then create role rafik_service nologin; end if; end $$;
do $$ begin if not exists(select 1 from pg_roles where rolname='rafik_api') then create role rafik_api login noinherit password 'rafik-local-api-only'; end if; end $$;
grant rafik_guest,rafik_user to rafik_api;
create table identity.users(id uuid primary key default gen_random_uuid(), email text unique, email_confirmed_at timestamptz, raw_user_meta_data jsonb not null default '{}', created_at timestamptz not null default now());
create function identity.actor_id() returns uuid language sql stable as $$ select nullif(current_setting('rafik.actor',true),'')::uuid $$;
create function identity.claims() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('rafik.claims',true),''),'{}')::jsonb $$;
create table file_store.buckets(id text primary key,name text not null,public boolean not null default false,file_size_limit bigint,allowed_mime_types text[]);
create table file_store.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references file_store.buckets(id),name text not null,metadata jsonb not null,unique(bucket_id,name));
alter table file_store.objects enable row level security;
grant usage on schema public,identity,file_store,extensions to rafik_user,rafik_guest,rafik_api;
grant execute on function identity.actor_id(),identity.claims() to rafik_user,rafik_guest;
grant select,insert,delete on file_store.objects to rafik_user;
grant all on identity.users to rafik_api;
-- Fresh Rafik domain. No legacy schema, broad workflow triggers, or external calls.
create extension if not exists pgcrypto with schema extensions;
revoke create on schema public from public, rafik_guest, rafik_user;

create table public.profiles (
  id uuid primary key references identity.users(id) on delete cascade,
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
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone'; end if;
  insert into public.profiles(id,display_name,locale,timezone) values(identity.actor_id(),left(coalesce(nullif(trim(p_name),''),nullif(split_part(identity.claims()->>'email','@',1),''),'Your name'),80),p_locale,p_timezone)
    on conflict(id) do nothing;
  select * into r from public.profiles where id=identity.actor_id(); return r;
end $$;
create function public.update_profile(p_name text,p_locale text,p_units text,p_timezone text) returns public.profiles
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.profiles;
begin
  if not exists(select 1 from pg_timezone_names where name=p_timezone) then raise exception 'invalid_timezone'; end if;
  update public.profiles set display_name=trim(p_name),locale=p_locale,units=p_units,timezone=p_timezone where id=identity.actor_id() returning * into r;
  if not found then raise exception 'unauthenticated'; end if; return r;
end $$;

create function public.save_plan(p_id uuid,p_title text,p_draft jsonb,p_expected_version integer default null) returns public.plans
language plpgsql security definer set search_path = public, pg_temp as $$
declare r public.plans;
begin
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  perform public.validate_prescription(p_draft);
  if p_expected_version is null then
    insert into public.plans(id,coach_id,title,draft) values(p_id,identity.actor_id(),trim(p_title),p_draft)
      on conflict(id) do nothing returning * into r;
    if not found then
      select * into r from public.plans where id=p_id and coach_id=identity.actor_id();
      if not found then raise exception 'forbidden'; end if;
      if r.title is distinct from trim(p_title) or r.draft is distinct from p_draft then raise exception 'conflict'; end if;
    end if;
  else
    select * into r from public.plans where id=p_id and coach_id=identity.actor_id() and not archived for update;
    if not found then raise exception 'forbidden'; end if;
    -- A lost acknowledgment can be retried without creating a new draft revision.
    if r.title=trim(p_title) and r.draft=p_draft and r.draft_version in (p_expected_version,p_expected_version+1) then return r; end if;
    update public.plans set title=trim(p_title),draft=p_draft,draft_version=draft_version+1,updated_at=now()
      where id=p_id and coach_id=identity.actor_id() and draft_version=p_expected_version and not archived returning * into r;
    if not found then raise exception 'conflict'; end if;
  end if; return r;
end $$;
create function public.publish_plan(p_id uuid,p_expected_version integer) returns public.plan_versions
language plpgsql security definer set search_path = public, pg_temp as $$
declare p public.plans; v public.plan_versions;
begin
  select * into p from public.plans where id=p_id and coach_id=identity.actor_id() and not archived for update;
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
  if not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=identity.actor_id()) then raise exception 'forbidden'; end if;
  if char_length(p_token)<40 or char_length(p_token)>100 or p_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or char_length(p_email)>254 then raise exception 'invalid_invitation'; end if;
  insert into public.invitations(coach_id,intended_email,version_id,token_hash,request_id)
    values(identity.actor_id(),lower(trim(p_email)),p_version_id,encode(digest(p_token,'sha256'),'hex'),p_request_id)
    on conflict(coach_id,request_id) do nothing returning * into r;
  if not found then
    select * into r from public.invitations where coach_id=identity.actor_id() and request_id=p_request_id;
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
declare i public.invitations; u identity.users; rel uuid; a uuid;
begin
  select * into u from identity.users where id=identity.actor_id();
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
  update public.invitations set status='revoked' where id=p_id and coach_id=identity.actor_id() and status='pending';
  if not found then raise exception 'invitation_unavailable'; end if;
end $$;
create function public.assign_plan(p_relationship_id uuid,p_version_id uuid) returns public.assignments
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.coach_clients; a public.assignments;
begin
  select * into c from public.coach_clients where id=p_relationship_id and coach_id=identity.actor_id() and state='active' for update;
  if not found or not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=identity.actor_id()) then raise exception 'forbidden'; end if;
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
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=identity.actor_id();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select * into a from public.assignments where id=p_assignment_id and client_id=identity.actor_id() and state='active';
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
    values(p_id,identity.actor_id(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=identity.actor_id() and occurrence_key=occurrence; end if;
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
  select * into s from public.sessions where id=p_id and client_id=identity.actor_id() for update;
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
  update public.sessions set coach_note=trim(p_note),reviewed_at=now() where id=p_id and coach_id=identity.actor_id() and status='completed' returning * into s;
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
create policy profile_read on public.profiles for select to rafik_user using(id=identity.actor_id() or exists(select 1 from public.coach_clients c where (c.client_id=profiles.id and c.coach_id=identity.actor_id()) or (c.coach_id=profiles.id and c.client_id=identity.actor_id())));
create policy catalog_read on public.exercises for select to rafik_guest,rafik_user using(active);
create policy own_plans on public.plans for select to rafik_user using(coach_id=identity.actor_id());
create policy public_sample_read on public.plan_versions for select to rafik_guest,rafik_user using(is_public);
create policy published_read on public.plan_versions for select to rafik_user using(coach_id=identity.actor_id() or exists(select 1 from public.assignments a where a.version_id=plan_versions.id and a.client_id=identity.actor_id()) or exists(select 1 from public.sessions s where s.version_id=plan_versions.id and s.client_id=identity.actor_id()));
create policy relationship_read on public.coach_clients for select to rafik_user using(coach_id=identity.actor_id() or client_id=identity.actor_id());
create policy assignment_read on public.assignments for select to rafik_user using(coach_id=identity.actor_id() or client_id=identity.actor_id());
create policy invitation_read on public.invitations for select to rafik_user using(coach_id=identity.actor_id());
create policy session_read on public.sessions for select to rafik_user using(client_id=identity.actor_id() or coach_id=identity.actor_id());
create policy entries_read on public.set_entries for select to rafik_user using(exists(select 1 from public.sessions s where s.id=set_entries.session_id and (s.client_id=identity.actor_id() or s.coach_id=identity.actor_id())));
-- No client reads/writes the idempotency ledger directly.
revoke all on all tables in schema public from rafik_guest,rafik_user;
grant select on public.exercises,public.plan_versions to rafik_guest,rafik_user;
grant select on public.profiles,public.plans,public.coach_clients,public.assignments,public.invitations,public.sessions,public.set_entries to rafik_user;
revoke execute on all functions in schema public from public,rafik_guest,rafik_user;
grant execute on function public.get_invitation(text) to rafik_guest,rafik_user;
grant execute on function public.ensure_profile(text,text,text),public.update_profile(text,text,text,text),public.save_plan(uuid,text,jsonb,integer),public.publish_plan(uuid,integer),public.create_invitation(text,uuid,text,uuid),public.accept_invitation(text),public.revoke_invitation(uuid),public.assign_plan(uuid,uuid),public.session_document(uuid),public.start_session(uuid,uuid,text,uuid),public.save_session(uuid,integer,uuid,jsonb,text,boolean),public.review_session(uuid,text) to rafik_user;

-- Deleting a coach removes their plans and relationships, but other clients retain
-- their own session snapshots. Deleting a client removes that client's results.
create function public.delete_my_account(p_confirmation text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation'; end if;
  delete from identity.users where id=identity.actor_id();
end $$;
revoke all on function public.delete_my_account(text) from public,rafik_guest;
grant execute on function public.delete_my_account(text) to rafik_user;

-- Daily coaching: explicit ownership, richer prescriptions and bounded schedules.
alter table public.exercises add column owner_id uuid references public.profiles(id) on delete cascade;
alter table public.exercises add column kind text not null default 'strength' check(kind in ('strength','timed','distance'));
alter table public.exercises add column media_url text not null default '';
alter table public.exercises add column revision integer not null default 1;
create index exercises_owner on public.exercises(owner_id);
drop policy catalog_read on public.exercises;
create policy shared_catalog on public.exercises for select to rafik_guest,rafik_user using(owner_id is null and active);
create policy own_catalog on public.exercises for select to rafik_user using(owner_id=identity.actor_id());

create table public.client_context (
 id uuid primary key references public.coach_clients(id) on delete cascade,
 goals text not null default '' check(length(goals)<=2000),
 constraints text not null default '' check(length(constraints)<=2000),
 notes text not null default '' check(length(notes)<=5000),
 revision integer not null default 1, updated_at timestamptz not null default now()
);
alter table public.client_context enable row level security;
create policy coach_context on public.client_context for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=client_context.id and c.coach_id=identity.actor_id()));
grant select on public.client_context to rafik_user;

create function public.save_client_context(p_id uuid,p_goals text,p_constraints text,p_notes text,p_revision int) returns public.client_context
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.client_context;
begin
 perform 1 from public.coach_clients where id=p_id and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden'; end if;
 select * into r from public.client_context where id=p_id;
 if found then
  if r.goals=p_goals and r.constraints=p_constraints and r.notes=p_notes and r.revision in(p_revision,p_revision+1) then return r; end if;
  if r.revision is distinct from p_revision then raise exception 'conflict'; end if;
  update public.client_context set goals=p_goals,constraints=p_constraints,notes=p_notes,revision=revision+1,updated_at=now() where id=p_id returning * into r;
 else
  if p_revision is distinct from 0 then raise exception 'conflict'; end if;
  insert into public.client_context(id,goals,constraints,notes) values(p_id,p_goals,p_constraints,p_notes) returning * into r;
 end if; return r;
end $$;
create function public.set_client_state(p_id uuid,p_state text) returns public.coach_clients
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.coach_clients;
begin
 update public.coach_clients set state=p_state where id=p_id and coach_id=identity.actor_id() returning * into r;
 if not found then raise exception 'forbidden'; end if; return r;
end $$;
create function public.save_exercise(p_id text,p_data jsonb,p_revision int) returns public.exercises
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.exercises;
begin
 if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
 if length(p_id) not between 1 and 100 or length(coalesce(p_data->>'name','')) not between 1 and 120
 or length(coalesce(p_data->>'instructions','')) not between 1 and 2000
 or length(coalesce(p_data->>'name_ar',''))>120 or length(coalesce(p_data->>'instructions_ar',''))>2000
 or length(coalesce(p_data->>'equipment',''))>120 or length(coalesce(p_data->>'movement',''))>80
 or length(coalesce(p_data->>'equipment_ar',''))>120
 or coalesce(p_data->>'kind','') not in('strength','timed','distance')
 or (coalesce(p_data->>'media_url','')<>'' and (p_data->>'media_url' !~ '^https://[^[:space:]]+$' or length(p_data->>'media_url')>1000))
 then raise exception 'invalid_exercise'; end if;
 -- Serialize creates and edits of this catalog identity without locking unrelated exercises.
 perform pg_advisory_xact_lock(hashtextextended(p_id,0));
 select * into r from public.exercises where id=p_id for update;
 if found then
  if r.owner_id is distinct from identity.actor_id() then raise exception 'forbidden'; end if;
  if r.revision is distinct from p_revision then
   if r.revision=p_revision+1 and (to_jsonb(r)-'id'-'owner_id'-'revision'-'active')=p_data then return r; end if;
   raise exception 'conflict';
  end if;
  update public.exercises set name=p_data->>'name',name_ar=coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),equipment=coalesce(p_data->>'equipment',''),equipment_ar=coalesce(p_data->>'equipment_ar',''),instructions=p_data->>'instructions',instructions_ar=coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),movement=coalesce(p_data->>'movement',''),kind=p_data->>'kind',media_url=coalesce(p_data->>'media_url',''),revision=revision+1 where id=p_id returning * into r;
 else
  if p_revision is distinct from 0 then raise exception 'conflict'; end if;
  insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
  values(p_id,identity.actor_id(),p_data->>'name',coalesce(nullif(p_data->>'name_ar',''),p_data->>'name'),coalesce(p_data->>'equipment',''),coalesce(p_data->>'equipment_ar',''),p_data->>'instructions',coalesce(nullif(p_data->>'instructions_ar',''),p_data->>'instructions'),coalesce(p_data->>'movement',''),p_data->>'kind',coalesce(p_data->>'media_url','')) returning * into r;
 end if; return r;
end $$;
create function public.set_exercise_active(p_id text,p_active boolean) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.exercises set active=p_active where id=p_id and owner_id=identity.actor_id();
 if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.validate_prescription(p jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare d jsonb; e jsonb; target jsonb; day_ids text[]:=array[]::text[]; slots text[]:=array[]::text[]; keys text[]; slot text; kind text; training int:=0;
begin
 if jsonb_typeof(p) is distinct from 'object' or coalesce(p->>'schema','') not in('1','2') or jsonb_typeof(p->'days') is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p->'days') not between 1 and 84 or coalesce((p->>'cycleWeeks')::int,1) not between 1 and 12 then raise exception 'invalid_day_count'; end if;
 for d in select value from jsonb_array_elements(p->'days') loop
  if nullif(d->>'id','') is null or d->>'id'=any(day_ids) or length(coalesce(d->>'name','')) not between 1 and 80
   or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'invalid_day'; end if;
  day_ids:=array_append(day_ids,d->>'id'); keys:=array[]::text[];
  if p->>'schema'='2' then
   if coalesce((d->>'week')::int,0) not between 1 and coalesce((p->>'cycleWeeks')::int,1) or coalesce((d->>'weekday')::int,-1) not between 0 and 6 then raise exception 'invalid_schedule'; end if;
   slot:=(d->>'week')||':'||(d->>'weekday');
   if slot=any(slots) then raise exception 'invalid_duplicate_day'; end if;
   slots:=array_append(slots,slot);
  end if;
  if coalesce((d->>'restDay')::boolean,false) then
   if jsonb_array_length(d->'exercises')<>0 then raise exception 'invalid_rest_day'; end if;
   continue;
  end if;
  training:=training+1;
  if jsonb_array_length(d->'exercises') not between 1 and 12 then raise exception 'invalid_exercise_count'; end if;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   kind:=coalesce(e->>'kind','strength');
   if nullif(e->>'key','') is null or e->>'key'=any(keys)
    or not exists(select 1 from public.exercises x where x.id=e->>'exerciseId' and x.active and (x.owner_id is null or x.owner_id=identity.actor_id()))
    or coalesce((e->>'sets')::int,0) not between 1 and 10 or kind not in('strength','timed','distance')
    or coalesce((e->>'reps')::int,0) not between 1 and 100 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
    or coalesce(e->>'unit','') not in('kg','lb') or coalesce((e->>'rest')::int,-1) not between 0 and 600
    or length(coalesce(e->>'note',''))>500 or length(coalesce(e->>'group',''))>40 then raise exception 'invalid_exercise'; end if;
   if e ? 'targets' and (jsonb_typeof(e->'targets') is distinct from 'array' or jsonb_array_length(e->'targets')<>(e->>'sets')::int) then raise exception 'invalid_targets'; end if;
   for target in select value from jsonb_array_elements(coalesce(e->'targets',jsonb_build_array(e))) loop
    if coalesce((target->>'reps')::int,0) not between 1 and 100 or coalesce((target->>'load')::numeric,-1) not between 0 and 1000
      or (kind='timed' and coalesce((target->>'seconds')::int,0) not between 1 and 86400)
      or (kind='distance' and coalesce((target->>'metres')::numeric,0) not between 1 and 1000000)
      or (target->>'effort' is not null and (target->>'effort')::numeric not between 1 and 10) then raise exception 'invalid_target'; end if;
   end loop;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;
create function public.snapshot_prescription(p jsonb) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select jsonb_set(p,'{days}',(select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((select jsonb_agg(e.value||jsonb_build_object('info',to_jsonb(x)-'owner_id'-'revision'-'active') order by e.n) from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n) join public.exercises x on x.id=e.value->>'exerciseId'),'[]'::jsonb)) order by d.n) from jsonb_array_elements(p->'days') with ordinality d(value,n)));
$$;

alter table public.assignments add column schedule_mode text not null default 'flexible' check(schedule_mode in('flexible','cycle'));
alter table public.assignments add column end_date date;
alter table public.assignments add column revision int not null default 1;
alter table public.assignments add constraint assignment_dates check(end_date is null or end_date>=start_date);
alter table public.set_entries add column seconds integer check(seconds between 0 and 86400);
alter table public.set_entries add column metres numeric(12,2) check(metres between 0 and 1000000);
alter table public.set_entries add column effort numeric(3,1) check(effort between 1 and 10);

create table public.schedule_exceptions (
 id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade,
 day_id text not null, scheduled_date date not null, target_date date not null,
 state text not null check(state in('moved','skipped')), unique(assignment_id,day_id,scheduled_date)
);
alter table public.schedule_exceptions enable row level security;
create policy participant_schedule on public.schedule_exceptions for select to rafik_user using(exists(select 1 from public.assignments a where a.id=assignment_id and (a.coach_id=identity.actor_id() or a.client_id=identity.actor_id())));
grant select on public.schedule_exceptions to rafik_user;

create function public.configure_assignment(p_id uuid,p_version_id uuid,p_start date,p_end date,p_mode text,p_revision int) returns public.assignments
language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.assignments; v public.plan_versions;
begin
 select * into a from public.assignments where id=p_id and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden'; end if;
 if a.version_id=p_version_id and a.start_date=p_start and a.end_date is not distinct from p_end and a.schedule_mode=p_mode and a.revision in(p_revision,p_revision+1) then return a; end if;
 if a.revision is distinct from p_revision then raise exception 'conflict'; end if;
 select * into v from public.plan_versions where id=p_version_id and coach_id=identity.actor_id();
 if not found or (p_mode='cycle' and v.prescription->>'schema'<>'2') then raise exception 'invalid_schedule'; end if;
 if p_start is null then raise exception 'invalid_schedule'; end if;
 update public.assignments set version_id=p_version_id,start_date=p_start,end_date=p_end,schedule_mode=p_mode,revision=revision+1 where id=p_id returning * into a;
 delete from public.schedule_exceptions where assignment_id=p_id;
 return a;
end $$;

-- A bounded projection, not a pre-generated future-session queue.
create function public.assignment_schedule(p_id uuid,p_from date,p_to date) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare a public.assignments; p jsonb; result jsonb;
begin
 select * into a from public.assignments where id=p_id and (coach_id=identity.actor_id() or client_id=identity.actor_id());
 if not found then raise exception 'forbidden'; end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>41 then raise exception 'invalid_window'; end if;
 if a.schedule_mode='flexible' then return '[]'::jsonb; end if;
 select prescription into p from public.plan_versions where id=a.version_id;
 with base as (
  select g::date as original_date,d.value as day from generate_series(greatest(a.start_date,p_from-41)::timestamp,least(coalesce(a.end_date,p_to+41),p_to+41)::timestamp,'1 day') g
  cross join jsonb_array_elements(p->'days') d
  where mod(g::date-a.start_date,coalesce((p->>'cycleWeeks')::int,1)*7)=((d.value->>'week')::int-1)*7+(d.value->>'weekday')::int
 ), projected as (
  select b.*,coalesce(x.target_date,b.original_date) as date,coalesce(x.state,case when coalesce((b.day->>'restDay')::boolean,false) then 'rest' else 'planned' end) as state
  from base b left join public.schedule_exceptions x on x.assignment_id=a.id and x.day_id=b.day->>'id' and x.scheduled_date=b.original_date
 )
 select coalesce(jsonb_agg(jsonb_build_object('date',q.date,'scheduled_date',q.original_date,'day',q.day,'state',coalesce(s.status,q.state),'session_id',s.id) order by q.date,q.day->>'id'),'[]'::jsonb) into result
 from projected q left join public.sessions s on s.client_id=a.client_id and s.occurrence_key=a.id::text||':'||q.original_date::text||':'||(q.day->>'id')
 where q.date between p_from and p_to;
 return result;
end $$;
create function public.change_scheduled_day(p_id uuid,p_day_id text,p_date date,p_target date,p_state text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.assignments; p jsonb; d jsonb;
begin
 select * into a from public.assignments where id=p_id and coach_id=identity.actor_id() and state='active' for update;
 if not found then raise exception 'forbidden'; end if;
 select prescription into p from public.plan_versions where id=a.version_id;
 select value into d from jsonb_array_elements(p->'days') where value->>'id'=p_day_id;
 if a.schedule_mode<>'cycle' or d is null or coalesce((d->>'restDay')::boolean,false) or p_date<a.start_date or p_date>coalesce(a.end_date,p_date)
 or mod(p_date-a.start_date,coalesce((p->>'cycleWeeks')::int,1)*7)<>((d->>'week')::int-1)*7+(d->>'weekday')::int
 or p_date is null or p_target is null or abs(p_target-p_date)>41 or p_target<a.start_date or p_target>coalesce(a.end_date,p_target)
 or p_state not in('moved','skipped','planned') then raise exception 'invalid_schedule'; end if;
 if exists(select 1 from public.sessions where client_id=a.client_id and occurrence_key=a.id::text||':'||p_date::text||':'||p_day_id) then raise exception 'session_started'; end if;
 if p_state='planned' then delete from public.schedule_exceptions where assignment_id=p_id and day_id=p_day_id and scheduled_date=p_date;
 else insert into public.schedule_exceptions(assignment_id,day_id,scheduled_date,target_date,state) values(p_id,p_day_id,p_date,p_target,p_state)
 on conflict(assignment_id,day_id,scheduled_date) do update set target_date=excluded.target_date,state=excluded.state; end if;
end $$;

create or replace function public.publish_plan(p_id uuid,p_expected_version integer) returns public.plan_versions
language plpgsql security definer set search_path = public, pg_temp as $$
declare p public.plans; v public.plan_versions;
begin
  select * into p from public.plans where id=p_id and coach_id=identity.actor_id() and not archived for update;
  if not found then raise exception 'forbidden'; end if;
  if p_expected_version is null or p.draft_version<>p_expected_version then raise exception 'conflict'; end if;
  perform public.validate_prescription(p.draft);
  select * into v from public.plan_versions where plan_id=p_id and revision=p.draft_version;
  if found then return v; end if;
  insert into public.plan_versions(plan_id,coach_id,revision,title,prescription) values(p.id,p.coach_id,p.draft_version,p.title,public.snapshot_prescription(p.draft)) returning * into v;
  return v;
end $$;
create or replace function public.assign_plan(p_relationship_id uuid,p_version_id uuid) returns public.assignments
language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.coach_clients; a public.assignments;
begin
  select * into c from public.coach_clients where id=p_relationship_id and coach_id=identity.actor_id() and state='active' for update;
  if not found or not exists(select 1 from public.plan_versions where id=p_version_id and coach_id=identity.actor_id()) then raise exception 'forbidden'; end if;
  select * into a from public.assignments where relationship_id=c.id and state='active';
  if found then
    update public.assignments set version_id=p_version_id,revision=revision+1 where id=a.id returning * into a;
  else
    insert into public.assignments(relationship_id,coach_id,client_id,version_id) values(c.id,c.coach_id,c.client_id,p_version_id) returning * into a;
  end if; delete from public.schedule_exceptions where assignment_id=a.id; return a;
end $$;
drop function public.start_session(uuid,uuid,text,uuid);
create or replace function public.start_session(p_id uuid,p_version_id uuid,p_day_id text,p_assignment_id uuid default null,p_scheduled_date date default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.plan_versions; a public.assignments; d jsonb; e jsonb; s public.sessions; local_day date; preferred_unit text; occurrence text; c public.coach_clients; target jsonb; scheduled date; projection jsonb;
begin
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=identity.actor_id();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select c0.* into c from public.coach_clients c0 join public.assignments a0 on a0.relationship_id=c0.id where a0.id=p_assignment_id and a0.client_id=identity.actor_id() for update of c0;
    if not found or c.state<>'active' then raise exception 'assignment_unavailable'; end if;
    select * into a from public.assignments where id=p_assignment_id and client_id=identity.actor_id() and state='active' for update;
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
    values(p_id,identity.actor_id(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=identity.actor_id() and occurrence_key=occurrence; end if;
  for e in select value from jsonb_array_elements(s.prescription->'exercises') loop
    for n in 0..(e->>'sets')::int-1 loop
      target:=coalesce(e->'targets'->n,e);
      insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit,seconds,metres,effort)
        values(s.id,e->>'key',n,(target->>'reps')::int,round((target->>'load')::numeric * case when preferred_unit=e->>'unit' then 1 when preferred_unit='lb' then 2.2046226218 else 1/2.2046226218 end,2),preferred_unit,(target->>'seconds')::int,(target->>'metres')::numeric,null) on conflict do nothing;
    end loop;
  end loop;
  return public.session_document(s.id);
end $$;
create or replace function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int; kind text;
begin
  select * into s from public.sessions where id=p_id and client_id=identity.actor_id() for update;
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
    select coalesce(x->>'kind','strength') into kind from jsonb_array_elements(s.prescription->'exercises') x where x->>'key'=e->>'exercise_key';
    if not exists(select 1 from public.set_entries where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int)
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or (e->>'seconds' is not null and (e->>'seconds')::int not between 0 and 86400)
      or (e->>'metres' is not null and (e->>'metres')::numeric not between 0 and 1000000)
      or (e->>'effort' is not null and (e->>'effort')::numeric not between 1 and 10)
      or ((e->>'completed')::boolean and ((kind='strength' and (e->>'reps')::int<1) or (kind='timed' and coalesce((e->>'seconds')::int,0)<1) or (kind='distance' and coalesce((e->>'metres')::numeric,0)<1))) then raise exception 'invalid_entry'; end if;
    update public.set_entries set reps=(e->>'reps')::int,load=(e->>'load')::numeric,unit=e->>'unit',completed=(e->>'completed')::boolean,seconds=(e->>'seconds')::int,metres=(e->>'metres')::numeric,effort=(e->>'effort')::numeric
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
create function public.previous_performance(p_exercises text[],p_before timestamptz) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 with latest as (
 select distinct on (x->>'exerciseId') x->>'exerciseId' as exercise_id,s.id,s.completed_at,x as prescription
 from public.sessions s cross join jsonb_array_elements(s.prescription->'exercises') x
 where s.client_id=identity.actor_id() and s.status='completed' and s.completed_at<p_before and x->>'exerciseId'=any(p_exercises[1:12])
 and exists(select 1 from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' and e.completed)
 order by x->>'exerciseId',s.completed_at desc,s.id
 ) select coalesce(jsonb_agg(jsonb_build_object('exercise_id',l.exercise_id,'completed_at',l.completed_at,'prescription',l.prescription,'entries',(select jsonb_agg(to_jsonb(e) order by e.set_index) from public.set_entries e where e.session_id=l.id and e.exercise_key=l.prescription->>'key' and e.completed))),'[]'::jsonb) from latest l;
$$;
revoke execute on function public.save_client_context(uuid,text,text,text,int), public.set_client_state(uuid,text), public.save_exercise(text,jsonb,int), public.set_exercise_active(text,boolean), public.snapshot_prescription(jsonb), public.configure_assignment(uuid,uuid,date,date,text,int), public.assignment_schedule(uuid,date,date), public.change_scheduled_day(uuid,text,date,date,text), public.start_session(uuid,uuid,text,uuid,date), public.previous_performance(text[],timestamptz) from public,rafik_guest,rafik_user;
grant execute on function public.save_client_context(uuid,text,text,text,int), public.set_client_state(uuid,text), public.save_exercise(text,jsonb,int), public.set_exercise_active(text,boolean), public.configure_assignment(uuid,uuid,date,date,text,int), public.assignment_schedule(uuid,date,date), public.change_scheduled_day(uuid,text,date,date,text), public.start_session(uuid,uuid,text,uuid,date), public.previous_performance(text[],timestamptz) to rafik_user;

-- Small explicit coaching domains. No delivery provider or workflow triggers.
create table public.coaching_forms (
 id uuid primary key, coach_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, kind text not null check(kind in('checkin','assessment')), fields jsonb not null,
 revision int not null default 1, updated_at timestamptz not null default now()
);
create table public.coaching_requests (
 id uuid primary key default gen_random_uuid(), series_id uuid not null, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 form_id uuid references public.coaching_forms(id) on delete set null, form_revision int not null,
 title text not null, kind text not null, fields jsonb not null, due_date date not null,
 answers jsonb not null default '{}', revision int not null default 1,
 submitted_at timestamptz, reviewed_at timestamptz, feedback text not null default '', cancelled boolean not null default false,
 updated_at timestamptz not null default now(), unique(series_id,due_date)
);
create index requests_relationship_due on public.coaching_requests(relationship_id,due_date);
create table public.measurements (
 id uuid primary key, client_id uuid not null references public.profiles(id) on delete cascade,
 relationship_id uuid references public.coach_clients(id) on delete cascade,
 metric text not null check(metric in('weight','waist')), measured_on date not null,
 value numeric not null check(value>0 and value<=2000), unit text not null check(unit in('kg','lb','cm','in')),
 revision int not null default 1, check((metric='weight' and unit in('kg','lb')) or (metric='waist' and unit in('cm','in')))
);
create index measurements_owner_date on public.measurements(client_id,measured_on);
create table public.messages (
 id uuid primary key, sequence bigint generated always as identity unique,
 relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 4000),
 session_id uuid references public.sessions(id) on delete set null,
 request_id uuid references public.coaching_requests(id) on delete set null,
 created_at timestamptz not null default now(), check(session_id is null or request_id is null)
);
create index messages_conversation on public.messages(relationship_id,sequence desc);
create table public.conversation_reads (
 id uuid primary key default gen_random_uuid(), relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade, last_sequence bigint not null default 0,
 unique(relationship_id,user_id)
);

create function public.validate_coaching_fields(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare f jsonb; ids text[]:='{}'::text[]; begin
 if jsonb_typeof(p) is distinct from 'array' then raise exception 'invalid_fields'; end if;
 if jsonb_array_length(p) not between 1 and 10 then raise exception 'invalid_fields'; end if;
 for f in select value from jsonb_array_elements(p) loop
  if jsonb_typeof(f) is distinct from 'object' or coalesce(f->>'id','') !~ '^[a-zA-Z0-9_-]{1,64}$' or f->>'id'=any(ids)
   or char_length(trim(coalesce(f->>'label',''))) not between 1 and 160 or coalesce(f->>'type','') not in('text','number','boolean')
   or jsonb_typeof(f->'required') is distinct from 'boolean' or char_length(coalesce(f->>'unit',''))>24 then raise exception 'invalid_fields'; end if;
  if f->>'type'='number' then
   if (f ? 'min' and jsonb_typeof(f->'min')<>'number') or (f ? 'max' and jsonb_typeof(f->'max')<>'number') then raise exception 'invalid_fields'; end if;
   if (f->>'min')::numeric>(f->>'max')::numeric then raise exception 'invalid_fields'; end if;
  end if;
  ids:=array_append(ids,f->>'id');
 end loop;
end $$;
create function public.save_coaching_form(p_id uuid,p_title text,p_kind text,p_fields jsonb,p_revision int) returns public.coaching_forms
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.coaching_forms; begin
 if identity.actor_id() is null then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into f from public.coaching_forms where id=p_id;
 if found and f.coach_id<>identity.actor_id() then raise exception 'forbidden'; end if;
 perform public.validate_coaching_fields(p_fields);
 if char_length(trim(coalesce(p_title,''))) not between 1 and 100 or coalesce(p_kind,'') not in('checkin','assessment') then raise exception 'invalid_form'; end if;
 if f.id is not null and f.title=trim(p_title) and f.kind=p_kind and f.fields=p_fields then return f; end if;
 if p_revision is null or coalesce(f.revision,0)<>p_revision then raise exception 'conflict'; end if;
 insert into public.coaching_forms(id,coach_id,title,kind,fields) values(p_id,identity.actor_id(),trim(p_title),p_kind,p_fields)
 on conflict(id) do update set title=excluded.title,kind=excluded.kind,fields=excluded.fields,revision=coaching_forms.revision+1,updated_at=now() returning * into f;
 return f;
end $$;
create function public.assign_coaching_form(p_series uuid,p_relationship uuid,p_form uuid,p_revision int,p_due date,p_count int,p_interval int) returns setof public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.coaching_forms; r public.coach_clients; existing public.coaching_requests; begin
 select * into r from public.coach_clients where id=p_relationship and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_series::text,0));
 select * into existing from public.coaching_requests where series_id=p_series order by due_date limit 1;
 if found then
  if existing.relationship_id<>p_relationship or existing.form_id<>p_form or existing.form_revision<>p_revision or existing.due_date<>p_due
   or (select count(*) from public.coaching_requests where series_id=p_series)<>p_count
   or exists(select 1 from (select due_date,row_number() over(order by due_date)-1 n from public.coaching_requests where series_id=p_series) x where x.due_date<>p_due+x.n::int*p_interval)
   then raise exception 'conflict'; end if;
  return query select * from public.coaching_requests where series_id=p_series order by due_date; return;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived'; end if;
 select * into f from public.coaching_forms where id=p_form and coach_id=identity.actor_id();
 if not found then raise exception 'forbidden'; end if;
 if f.revision is distinct from p_revision then raise exception 'conflict'; end if;
 if p_due is null or p_due<current_date-366 or p_due>current_date+366 or p_count is null or p_count not between 1 and 12 or p_interval is null or p_interval not in(7,14) then raise exception 'invalid_schedule'; end if;
 return query insert into public.coaching_requests(series_id,relationship_id,form_id,form_revision,title,kind,fields,due_date)
 select p_series,r.id,f.id,f.revision,f.title,f.kind,f.fields,p_due+n*p_interval from generate_series(0,p_count-1) n returning *;
end $$;
create function public.save_coaching_response(p_id uuid,p_answers jsonb,p_revision int,p_submit boolean) returns public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; r public.coach_clients; f jsonb; a jsonb; begin
 select c.* into r from public.coach_clients c join public.coaching_requests x on x.relationship_id=c.id where x.id=p_id and c.client_id=identity.actor_id() for update of c;
 if not found then raise exception 'forbidden'; end if;
 select * into q from public.coaching_requests where id=p_id for update;
 if q.answers=p_answers and (not p_submit or q.submitted_at is not null) and not q.cancelled then return q; end if;
 if r.state<>'active' or q.cancelled then raise exception 'request_unavailable'; end if;
 if p_revision is distinct from q.revision then raise exception 'conflict'; end if;
 if p_submit is null or jsonb_typeof(p_answers) is distinct from 'object' then raise exception 'invalid_answers'; end if;
 if exists(select 1 from jsonb_object_keys(p_answers) k where not exists(select 1 from jsonb_array_elements(q.fields) field where field->>'id'=k)) then raise exception 'invalid_answers'; end if;
 for f in select value from jsonb_array_elements(q.fields) loop
  a:=p_answers->(f->>'id');
  if a is null or a='null'::jsonb or a='""'::jsonb then
   if (p_submit or q.submitted_at is not null) and (f->>'required')::boolean then raise exception 'required_answer'; end if;
  elsif f->>'type'='text' then
   if jsonb_typeof(a)<>'string' or char_length(a#>>'{}')>2000 then raise exception 'invalid_answers'; end if;
   if (p_submit or q.submitted_at is not null) and (f->>'required')::boolean and trim(a#>>'{}')='' then raise exception 'required_answer'; end if;
  elsif f->>'type'='boolean' then
   if jsonb_typeof(a)<>'boolean' then raise exception 'invalid_answers'; end if;
  else
   if jsonb_typeof(a)<>'number' then raise exception 'invalid_answers'; end if;
   if abs((a#>>'{}')::numeric)>1000000 or (a#>>'{}')::numeric<(f->>'min')::numeric or (a#>>'{}')::numeric>(f->>'max')::numeric then raise exception 'invalid_answers'; end if;
  end if;
 end loop;
 update public.coaching_requests set answers=p_answers,submitted_at=case when p_submit then coalesce(submitted_at,now()) else submitted_at end,
 reviewed_at=null,feedback='',revision=revision+1,updated_at=now() where id=p_id returning * into q; return q;
end $$;
create function public.review_coaching_response(p_id uuid,p_revision int,p_feedback text) returns public.coaching_requests
language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; begin
 select x.* into q from public.coaching_requests x join public.coach_clients c on c.id=x.relationship_id where x.id=p_id and c.coach_id=identity.actor_id() for update of x;
 if not found then raise exception 'forbidden'; end if;
 if q.submitted_at is null or char_length(coalesce(p_feedback,''))>2000 then raise exception 'invalid_review'; end if;
 if q.reviewed_at is not null and q.feedback=p_feedback and q.revision=p_revision+1 then return q; end if;
 if p_revision is distinct from q.revision then raise exception 'conflict'; end if;
 update public.coaching_requests set feedback=coalesce(p_feedback,''),reviewed_at=now(),revision=revision+1,updated_at=now() where id=p_id returning * into q; return q;
end $$;
create function public.cancel_coaching_request(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare q public.coaching_requests; begin
 select x.* into q from public.coaching_requests x join public.coach_clients c on c.id=x.relationship_id where x.id=p_id and c.coach_id=identity.actor_id() for update of x;
 if not found then raise exception 'forbidden'; end if;
 if q.cancelled then return; end if;
 if q.submitted_at is not null then raise exception 'already_submitted'; end if;
 if q.revision is distinct from p_revision then raise exception 'conflict'; end if;
 update public.coaching_requests set cancelled=true,revision=revision+1 where id=p_id;
end $$;
create function public.save_measurement(p_id uuid,p_relationship uuid,p_metric text,p_date date,p_value numeric,p_unit text,p_revision int) returns public.measurements
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.measurements; begin
 if identity.actor_id() is null then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into m from public.measurements where id=p_id;
 if found and m.client_id<>identity.actor_id() then raise exception 'forbidden'; end if;
 if m.id is not null and m.relationship_id is not distinct from p_relationship and m.metric=p_metric and m.measured_on=p_date and m.value=p_value and m.unit=p_unit then return m; end if;
 if p_revision is distinct from coalesce(m.revision,0) then raise exception 'conflict'; end if;
 if p_relationship is not null and not exists(select 1 from public.coach_clients where id=p_relationship and client_id=identity.actor_id() and state='active') then raise exception 'forbidden'; end if;
 if p_date is null or p_date> (select (now() at time zone timezone)::date from public.profiles where id=identity.actor_id()) or p_date<current_date-3650
 or p_value is null or p_value<=0 or p_value>2000 or coalesce(p_metric,'') not in('weight','waist')
 or not ((p_metric='weight' and p_unit in('kg','lb')) or (p_metric='waist' and p_unit in('cm','in'))) or p_unit is null then raise exception 'invalid_measurement'; end if;
 insert into public.measurements(id,client_id,relationship_id,metric,measured_on,value,unit) values(p_id,identity.actor_id(),p_relationship,p_metric,p_date,p_value,p_unit)
 on conflict(id) do update set relationship_id=excluded.relationship_id,metric=excluded.metric,measured_on=excluded.measured_on,value=excluded.value,unit=excluded.unit,revision=measurements.revision+1 returning * into m; return m;
end $$;
create function public.remove_measurement(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.measurements; begin
 select * into m from public.measurements where id=p_id for update;
 if not found then return; end if;
 if m.client_id<>identity.actor_id() then raise exception 'forbidden'; end if;
 if m.revision is distinct from p_revision then raise exception 'conflict'; end if;
 delete from public.measurements where id=p_id;
end $$;
create function public.send_message(p_id uuid,p_relationship uuid,p_body text,p_session uuid default null,p_request uuid default null) returns public.messages
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.messages;r public.coach_clients;begin
 select * into r from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into m from public.messages where id=p_id;
 if found then
  if m.sender_id<>identity.actor_id() or m.relationship_id<>p_relationship or m.body is distinct from trim(p_body) or m.session_id is distinct from p_session or m.request_id is distinct from p_request then raise exception 'conflict'; end if;
  return m;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived'; end if;
 if char_length(trim(coalesce(p_body,''))) not between 1 and 4000 or (p_session is not null and p_request is not null) then raise exception 'invalid_message'; end if;
 if p_session is not null and not exists(select 1 from public.sessions where id=p_session and coach_id=r.coach_id and client_id=r.client_id) then raise exception 'invalid_context'; end if;
 if p_request is not null and not exists(select 1 from public.coaching_requests where id=p_request and relationship_id=r.id) then raise exception 'invalid_context'; end if;
 insert into public.messages(id,relationship_id,sender_id,body,session_id,request_id) values(p_id,r.id,identity.actor_id(),trim(p_body),p_session,p_request) returning * into m;return m;
end $$;
create function public.mark_conversation_read(p_relationship uuid,p_sequence bigint) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id)) then raise exception 'forbidden'; end if;
 if not exists(select 1 from public.messages where relationship_id=p_relationship and sequence=p_sequence) then raise exception 'invalid_cursor'; end if;
 insert into public.conversation_reads(relationship_id,user_id,last_sequence) values(p_relationship,identity.actor_id(),p_sequence)
 on conflict(relationship_id,user_id) do update set last_sequence=greatest(conversation_reads.last_sequence,excluded.last_sequence);
end $$;
create function public.conversation_inbox() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'state',c.state,'coach_id',c.coach_id,'client_id',c.client_id,'name',p.display_name,
 'unread',(select count(*) from public.messages m where m.relationship_id=c.id and m.sender_id<>identity.actor_id() and m.sequence>coalesce(r.last_sequence,0)),
 'latest',(select body from public.messages where relationship_id=c.id order by sequence desc limit 1),
 'updated_at',(select created_at from public.messages where relationship_id=c.id order by sequence desc limit 1)) order by c.created_at desc),'[]'::jsonb)
 from public.coach_clients c join public.profiles p on p.id=case when c.coach_id=identity.actor_id() then c.client_id else c.coach_id end
 left join public.conversation_reads r on r.relationship_id=c.id and r.user_id=identity.actor_id() where identity.actor_id() in(c.coach_id,c.client_id);
$$;
-- Returns only acknowledged actuals visible in this relationship, or the client's own records.
create function public.training_progress(p_relationship uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; client uuid:=identity.actor_id(); result jsonb;begin
 if client is null then raise exception 'forbidden'; end if;
 if p_relationship is not null then
 select * into c from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id);
 if not found then raise exception 'forbidden'; end if; client:=c.client_id;
 end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 then raise exception 'invalid_window'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'date',s.local_date,'title',s.title,'exercises',(
 select coalesce(jsonb_agg(jsonb_build_object('id',e->>'exerciseId','name',coalesce(e#>>'{info,name}',(select name from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'name_ar',coalesce(e#>>'{info,name_ar}',e#>>'{info,name}',(select name_ar from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'kind',coalesce(e->>'kind','strength'),
 'sets',(select coalesce(jsonb_agg(to_jsonb(x)-'session_id' order by x.set_index),'[]'::jsonb) from public.set_entries x where x.session_id=s.id and x.exercise_key=e->>'key' and x.completed))),'[]'::jsonb) from jsonb_array_elements(s.prescription->'exercises') e
 )) order by s.local_date,s.completed_at),'[]'::jsonb) into result from public.sessions s
 where s.client_id=client and (p_relationship is null or s.coach_id=c.coach_id) and s.status='completed' and s.local_date between p_from and p_to; return result;
end $$;

alter table public.coaching_forms enable row level security;
alter table public.coaching_requests enable row level security;
alter table public.measurements enable row level security;
alter table public.messages enable row level security;
alter table public.conversation_reads enable row level security;
create policy forms_owner on public.coaching_forms for select to rafik_user using(coach_id=identity.actor_id());
create policy requests_participant on public.coaching_requests for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=relationship_id and identity.actor_id() in(c.coach_id,c.client_id)));
create policy measurements_shared on public.measurements for select to rafik_user using(client_id=identity.actor_id() or exists(select 1 from public.coach_clients c where c.id=relationship_id and c.coach_id=identity.actor_id()));
create policy messages_participant on public.messages for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=relationship_id and identity.actor_id() in(c.coach_id,c.client_id)));
create policy reads_owner on public.conversation_reads for select to rafik_user using(user_id=identity.actor_id());
revoke all on public.coaching_forms,public.coaching_requests,public.measurements,public.messages,public.conversation_reads from rafik_guest,rafik_user;
grant select on public.coaching_forms,public.coaching_requests,public.measurements,public.messages,public.conversation_reads to rafik_user;
revoke all on function public.validate_coaching_fields(jsonb),public.save_coaching_form(uuid,text,text,jsonb,int),public.assign_coaching_form(uuid,uuid,uuid,int,date,int,int),public.save_coaching_response(uuid,jsonb,int,boolean),public.review_coaching_response(uuid,int,text),public.cancel_coaching_request(uuid,int),public.save_measurement(uuid,uuid,text,date,numeric,text,int),public.remove_measurement(uuid,int),public.send_message(uuid,uuid,text,uuid,uuid),public.mark_conversation_read(uuid,bigint),public.conversation_inbox(),public.training_progress(uuid,date,date) from public,rafik_guest;
grant execute on function public.save_coaching_form(uuid,text,text,jsonb,int),public.assign_coaching_form(uuid,uuid,uuid,int,date,int,int),public.save_coaching_response(uuid,jsonb,int,boolean),public.review_coaching_response(uuid,int,text),public.cancel_coaching_request(uuid,int),public.save_measurement(uuid,uuid,text,date,numeric,text,int),public.remove_measurement(uuid,int),public.send_message(uuid,uuid,text,uuid,uuid),public.mark_conversation_read(uuid,bigint),public.conversation_inbox(),public.training_progress(uuid,date,date) to rafik_user;

-- Optional guidance and manual actuals. No nutrition provider or calculated prescription.
create table public.nutrition_guidance (
 id uuid primary key, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 revision int not null, effective_on date not null, targets jsonb not null, guidance text not null,
 created_at timestamptz not null default now(), unique(relationship_id,revision)
);
create table public.saved_foods (
 id uuid primary key, owner_id uuid not null references public.profiles(id) on delete cascade,
 name text not null, basis numeric not null, unit text not null, nutrients jsonb not null, source text not null,
 revision int not null default 1, archived boolean not null default false
);
create table public.meal_entries (
 id uuid primary key, client_id uuid not null references public.profiles(id) on delete cascade,
 relationship_id uuid references public.coach_clients(id) on delete cascade,
 logged_on date not null, meal text not null, food_id uuid references public.saved_foods(id) on delete set null,
 name text not null, quantity numeric not null, basis numeric not null, unit text not null,
 nutrients jsonb not null, source text not null, note text not null default '', revision int not null default 1,
 created_at timestamptz not null default now()
);
create index meals_owner_date on public.meal_entries(client_id,logged_on);
create index guidance_relationship_date on public.nutrition_guidance(relationship_id,effective_on desc,revision desc);
create function public.validate_nutrients(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare k text; v jsonb; begin
 if jsonb_typeof(p) is distinct from 'object' then raise exception 'invalid_nutrients';end if;
 for k,v in select * from jsonb_each(p) loop
  if k not in('kcal','protein_g','carb_g','fat_g') then raise exception 'invalid_nutrients';end if;
  if v<>'null'::jsonb and (jsonb_typeof(v)<>'number' or (v#>>'{}')::numeric<0 or (v#>>'{}')::numeric>10000) then raise exception 'invalid_nutrients';end if;
 end loop;
end $$;
create function public.save_nutrition_guidance(p_id uuid,p_relationship uuid,p_revision int,p_effective date,p_targets jsonb,p_guidance text) returns public.nutrition_guidance
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; g public.nutrition_guidance; latest int; today date; begin
 select * into c from public.coach_clients where id=p_relationship and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 select * into g from public.nutrition_guidance where id=p_id;
 if found then
  if g.relationship_id<>p_relationship or g.targets<>p_targets or g.guidance is distinct from p_guidance or g.effective_on is distinct from p_effective then raise exception 'conflict';end if;
  return g;
 end if;
 if c.state<>'active' then raise exception 'relationship_archived';end if;
 perform public.validate_nutrients(p_targets);
 select (now() at time zone timezone)::date into today from public.profiles where id=c.client_id;
 if p_effective is null or p_effective<today or p_effective>today+366 or char_length(coalesce(p_guidance,''))>4000 then raise exception 'invalid_guidance';end if;
 select coalesce(max(revision),0) into latest from public.nutrition_guidance where relationship_id=c.id;
 if p_revision is distinct from latest then raise exception 'conflict';end if;
 insert into public.nutrition_guidance(id,relationship_id,revision,effective_on,targets,guidance) values(p_id,c.id,latest+1,p_effective,p_targets,coalesce(p_guidance,'')) returning * into g;return g;
end $$;
create function public.save_food(p_id uuid,p_name text,p_basis numeric,p_unit text,p_nutrients jsonb,p_source text,p_revision int) returns public.saved_foods
language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.saved_foods;begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into f from public.saved_foods where id=p_id;
 if found and f.owner_id<>identity.actor_id() then raise exception 'forbidden';end if;
 if f.id is not null and f.name=trim(p_name) and f.basis=p_basis and f.unit=p_unit and f.nutrients=p_nutrients and f.source=trim(p_source) then return f;end if;
 if p_revision is distinct from coalesce(f.revision,0) then raise exception 'conflict';end if;
 perform public.validate_nutrients(p_nutrients);
 if char_length(trim(coalesce(p_name,''))) not between 1 and 120 or p_basis is null or p_basis<=0 or p_basis>10000 or coalesce(p_unit,'') not in('g','ml','serving') or char_length(trim(coalesce(p_source,''))) not between 1 and 200 then raise exception 'invalid_food';end if;
 insert into public.saved_foods(id,owner_id,name,basis,unit,nutrients,source) values(p_id,identity.actor_id(),trim(p_name),p_basis,p_unit,p_nutrients,trim(p_source))
 on conflict(id) do update set name=excluded.name,basis=excluded.basis,unit=excluded.unit,nutrients=excluded.nutrients,source=excluded.source,revision=saved_foods.revision+1 returning * into f;return f;
end $$;
create function public.archive_food(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.saved_foods;begin
 select * into f from public.saved_foods where id=p_id and owner_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;if f.archived then return;end if;
 if p_revision is distinct from f.revision then raise exception 'conflict';end if;
 update public.saved_foods set archived=true,revision=revision+1 where id=p_id;
end $$;
create function public.save_meal(p_id uuid,p_relationship uuid,p_date date,p_meal text,p_data jsonb,p_revision int) returns public.meal_entries
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.meal_entries; d jsonb:=p_data; c public.coach_clients; begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 if p_relationship is not null then
  select * into c from public.coach_clients where id=p_relationship and client_id=identity.actor_id() for update;
  if not found then raise exception 'forbidden';end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into m from public.meal_entries where id=p_id;
 if found and m.client_id<>identity.actor_id() then raise exception 'forbidden';end if;
 -- Snapshot values are explicit even when a saved-food reference exists; stale catalog edits cannot change a retry.
 if m.id is not null and m.relationship_id is not distinct from p_relationship and m.logged_on=p_date and m.meal=p_meal
 and m.name=trim(d->>'name') and m.quantity=(d->>'quantity')::numeric and m.basis=(d->>'basis')::numeric and m.unit=d->>'unit'
 and m.nutrients=d->'nutrients' and m.source=trim(d->>'source') and m.note=coalesce(d->>'note','') and m.food_id is not distinct from nullif(d->>'food_id','')::uuid then return m;end if;
 if c.state='archived' then raise exception 'relationship_archived';end if;
 if p_revision is distinct from coalesce(m.revision,0) then raise exception 'conflict';end if;
 perform public.validate_nutrients(d->'nutrients');
 if p_date is null or p_date<(current_date-3650) or p_date>(select (now() at time zone timezone)::date from public.profiles where id=identity.actor_id()) or coalesce(p_meal,'') not in('breakfast','lunch','dinner','snack')
 or char_length(trim(coalesce(d->>'name',''))) not between 1 and 120 or coalesce((d->>'quantity')::numeric,0)<=0 or (d->>'quantity')::numeric>10000
 or coalesce((d->>'basis')::numeric,0)<=0 or (d->>'basis')::numeric>10000 or coalesce(d->>'unit','') not in('g','ml','serving')
 or char_length(trim(coalesce(d->>'source',''))) not between 1 and 200 or char_length(coalesce(d->>'note',''))>2000 then raise exception 'invalid_meal';end if;
 if nullif(d->>'food_id','') is not null and not exists(select 1 from public.saved_foods where id=(d->>'food_id')::uuid and owner_id=identity.actor_id()) then raise exception 'forbidden';end if;
 insert into public.meal_entries(id,client_id,relationship_id,logged_on,meal,food_id,name,quantity,basis,unit,nutrients,source,note)
 values(p_id,identity.actor_id(),p_relationship,p_date,p_meal,nullif(d->>'food_id','')::uuid,trim(d->>'name'),(d->>'quantity')::numeric,(d->>'basis')::numeric,d->>'unit',d->'nutrients',trim(d->>'source'),coalesce(d->>'note',''))
 on conflict(id) do update set relationship_id=excluded.relationship_id,logged_on=excluded.logged_on,meal=excluded.meal,food_id=excluded.food_id,name=excluded.name,quantity=excluded.quantity,basis=excluded.basis,unit=excluded.unit,nutrients=excluded.nutrients,source=excluded.source,note=excluded.note,revision=meal_entries.revision+1 returning * into m;return m;
end $$;
create function public.remove_meal(p_id uuid,p_revision int) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.meal_entries;begin
 select * into m from public.meal_entries where id=p_id for update;if not found then return;end if;
 if m.client_id<>identity.actor_id() then raise exception 'forbidden';end if;if p_revision is distinct from m.revision then raise exception 'conflict';end if;
 delete from public.meal_entries where id=p_id;
end $$;
alter table public.nutrition_guidance enable row level security;
alter table public.saved_foods enable row level security;
alter table public.meal_entries enable row level security;
create policy guidance_participants on public.nutrition_guidance for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=relationship_id and identity.actor_id() in(c.coach_id,c.client_id)));
create policy foods_owner on public.saved_foods for select to rafik_user using(owner_id=identity.actor_id());
create policy meals_shared on public.meal_entries for select to rafik_user using(client_id=identity.actor_id() or exists(select 1 from public.coach_clients c where c.id=relationship_id and c.coach_id=identity.actor_id()));
revoke all on public.nutrition_guidance,public.saved_foods,public.meal_entries from rafik_guest,rafik_user;
grant select on public.nutrition_guidance,public.saved_foods,public.meal_entries to rafik_user;
revoke all on function public.validate_nutrients(jsonb),public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text),public.save_food(uuid,text,numeric,text,jsonb,text,int),public.archive_food(uuid,int),public.save_meal(uuid,uuid,date,text,jsonb,int),public.remove_meal(uuid,int) from public,rafik_guest;
grant execute on function public.save_nutrition_guidance(uuid,uuid,int,date,jsonb,text),public.save_food(uuid,text,numeric,text,jsonb,text,int),public.archive_food(uuid,int),public.save_meal(uuid,uuid,date,text,jsonb,int),public.remove_meal(uuid,int) to rafik_user;

-- Concrete availability instants and appointments; independent from training occurrences.
create table public.appointment_slots (
 id uuid primary key default gen_random_uuid(), series_id uuid not null, coach_id uuid not null references public.profiles(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, local_start timestamp not null, timezone text not null,
 title text not null, location text not null, state text not null default 'open' check(state in('open','booked','withdrawn')),
 unique(series_id,starts_at), check(ends_at>starts_at)
);
create index slots_coach_time on public.appointment_slots(coach_id,starts_at);
create table public.appointments (
 id uuid primary key, relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 slot_id uuid not null references public.appointment_slots(id), starts_at timestamptz not null, ends_at timestamptz not null,
 title text not null, location text not null, timezone text not null,
 state text not null default 'booked' check(state in('booked','cancelled','attended','missed')), note text not null default '',
 revision int not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index slot_one_booking on public.appointments(slot_id) where state='booked';
create index appointments_relationship_time on public.appointments(relationship_id,starts_at);
create function public.availability_preview(p_local timestamp,p_zone text,p_minutes int,p_count int,p_every int) returns jsonb
language plpgsql stable set search_path=public,pg_temp as $$
declare intended timestamp; instant timestamptz; result jsonb:='[]'::jsonb;begin
 if not exists(select 1 from pg_timezone_names where name=p_zone) or p_local is null or p_minutes is null or p_minutes not in(15,30,45,60,90,120) or p_count is null or p_count not between 1 and 8 or p_every is null or p_every not in(7,14) then raise exception 'invalid_availability';end if;
 for n in 0..p_count-1 loop
  intended:=p_local+make_interval(days=>n*p_every);instant:=intended at time zone p_zone;
  if instant at time zone p_zone<>intended then raise exception 'invalid_local_time';end if;
  result:=result||jsonb_build_array(jsonb_build_object('local_start',intended,'starts_at',instant,'ends_at',instant+make_interval(mins=>p_minutes)));
 end loop;return result;
end $$;
create function public.publish_availability(p_series uuid,p_local timestamp,p_zone text,p_minutes int,p_count int,p_every int,p_title text,p_location text) returns setof public.appointment_slots
language plpgsql security definer set search_path=public,pg_temp as $$
declare times jsonb; first_slot public.appointment_slots; x jsonb;begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 perform id from public.profiles where id=identity.actor_id() for update;
 perform pg_advisory_xact_lock(hashtextextended(p_series::text,0));
 times:=public.availability_preview(p_local,p_zone,p_minutes,p_count,p_every);
 select * into first_slot from public.appointment_slots where series_id=p_series order by starts_at limit 1;
 if found then
  if first_slot.coach_id<>identity.actor_id() or first_slot.title is distinct from trim(p_title) or first_slot.location is distinct from trim(p_location) or first_slot.timezone<>p_zone
  or (select count(*) from public.appointment_slots where series_id=p_series)<>p_count
  or exists(select 1 from jsonb_array_elements(times) t where not exists(select 1 from public.appointment_slots s where s.series_id=p_series and s.starts_at=(t->>'starts_at')::timestamptz and s.ends_at=(t->>'ends_at')::timestamptz)) then raise exception 'conflict';end if;
  return query select * from public.appointment_slots where series_id=p_series order by starts_at;return;
 end if;
 if char_length(trim(coalesce(p_title,''))) not between 1 and 100 or char_length(trim(coalesce(p_location,''))) not between 1 and 500 then raise exception 'invalid_availability';end if;
 for x in select value from jsonb_array_elements(times) loop
  if (x->>'starts_at')::timestamptz<=now() or (x->>'starts_at')::timestamptz>now()+interval '366 days' then raise exception 'invalid_availability';end if;
  if exists(select 1 from public.appointment_slots s where coach_id=identity.actor_id() and state<>'withdrawn' and tstzrange(s.starts_at,s.ends_at,'[)') && tstzrange((x->>'starts_at')::timestamptz,(x->>'ends_at')::timestamptz,'[)')) then raise exception 'time_unavailable';end if;
 end loop;
 return query insert into public.appointment_slots(series_id,coach_id,starts_at,ends_at,local_start,timezone,title,location)
 select p_series,identity.actor_id(),(t->>'starts_at')::timestamptz,(t->>'ends_at')::timestamptz,(t->>'local_start')::timestamp,p_zone,trim(p_title),trim(p_location) from jsonb_array_elements(times) t returning *;
end $$;
create function public.withdraw_availability(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.appointment_slots;begin
 perform id from public.profiles where id=identity.actor_id() for update;
 select * into s from public.appointment_slots where id=p_id and coach_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 if s.state='booked' then raise exception 'slot_booked';end if;
 update public.appointment_slots set state='withdrawn' where id=p_id;
end $$;
create function public.book_appointment(p_id uuid,p_relationship uuid,p_slot uuid) returns public.appointments
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; s public.appointment_slots; a public.appointments;begin
 select * into c from public.coach_clients where id=p_relationship and client_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 perform id from public.profiles where id in(c.coach_id,c.client_id) order by id for update;
 select * into a from public.appointments where id=p_id;
 if found then
  if a.relationship_id<>c.id or a.slot_id<>p_slot then raise exception 'conflict';end if;return a;
 end if;
 if c.state<>'active' then raise exception 'relationship_archived';end if;
 select * into s from public.appointment_slots where id=p_slot and coach_id=c.coach_id for update;
 if not found or s.state<>'open' or s.starts_at<=now() then raise exception 'time_unavailable';end if;
 if exists(select 1 from public.appointments ap join public.coach_clients r on r.id=ap.relationship_id where (r.client_id in(c.client_id,c.coach_id) or r.coach_id in(c.client_id,c.coach_id)) and ap.state='booked' and tstzrange(ap.starts_at,ap.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'time_unavailable';end if;
 insert into public.appointments(id,relationship_id,slot_id,starts_at,ends_at,title,location,timezone) values(p_id,c.id,s.id,s.starts_at,s.ends_at,s.title,s.location,s.timezone) returning * into a;
 update public.appointment_slots set state='booked' where id=s.id;return a;
end $$;
create function public.change_appointment(p_id uuid,p_revision int,p_action text,p_slot uuid default null,p_note text default '') returns public.appointments
language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; a public.appointments; s public.appointment_slots;begin
 select r.* into c from public.coach_clients r join public.appointments x on x.relationship_id=r.id where x.id=p_id and identity.actor_id() in(r.coach_id,r.client_id) for update of r;
 if not found then raise exception 'forbidden';end if;
 perform id from public.profiles where id in(c.coach_id,c.client_id) order by id for update;
 select * into a from public.appointments where id=p_id for update;
 if p_action in('cancelled','attended','missed') and a.state=p_action and a.note=p_note then return a;end if;
 if p_action='reschedule' and a.state='booked' and a.slot_id=p_slot then
  if a.note is distinct from coalesce(p_note,'') then raise exception 'conflict';end if;return a;end if;
 if p_revision is distinct from a.revision then raise exception 'conflict';end if;
 if a.state<>'booked' or char_length(coalesce(p_note,''))>2000 then raise exception 'appointment_unavailable';end if;
 if p_action in('attended','missed') then
  if identity.actor_id()<>c.coach_id or a.ends_at>now() then raise exception 'forbidden';end if;
  update public.appointments set state=p_action,note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 end if;
 if a.starts_at<=now() then raise exception 'appointment_unavailable';end if;
 if p_action='cancelled' then
  update public.appointment_slots set state='open' where id=a.slot_id;
  update public.appointments set state='cancelled',note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 elsif p_action='reschedule' then
  if c.state<>'active' then raise exception 'relationship_archived';end if;
  select * into s from public.appointment_slots where id=p_slot and coach_id=c.coach_id for update;
  if not found or s.state<>'open' or s.starts_at<=now() then raise exception 'time_unavailable';end if;
  if exists(select 1 from public.appointments x join public.coach_clients r on r.id=x.relationship_id where (r.client_id in(c.client_id,c.coach_id) or r.coach_id in(c.client_id,c.coach_id)) and x.state='booked' and x.id<>a.id and tstzrange(x.starts_at,x.ends_at,'[)') && tstzrange(s.starts_at,s.ends_at,'[)')) then raise exception 'time_unavailable';end if;
  update public.appointment_slots set state='open' where id=a.slot_id;
  update public.appointment_slots set state='booked' where id=s.id;
  update public.appointments set slot_id=s.id,starts_at=s.starts_at,ends_at=s.ends_at,title=s.title,location=s.location,timezone=s.timezone,note=coalesce(p_note,''),revision=revision+1,updated_at=now() where id=p_id returning * into a;return a;
 end if;raise exception 'invalid_action';
end $$;
alter table public.appointment_slots enable row level security;
alter table public.appointments enable row level security;
create policy slots_coach_clients on public.appointment_slots for select to rafik_user using(coach_id=identity.actor_id() or (state<>'withdrawn' and exists(select 1 from public.coach_clients c where c.coach_id=appointment_slots.coach_id and c.client_id=identity.actor_id() and c.state='active')));
create policy appointments_participants on public.appointments for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=relationship_id and identity.actor_id() in(c.coach_id,c.client_id)));
revoke all on public.appointment_slots,public.appointments from rafik_guest,rafik_user;
grant select on public.appointment_slots,public.appointments to rafik_user;
revoke all on function public.availability_preview(timestamp,text,int,int,int),public.publish_availability(uuid,timestamp,text,int,int,int,text,text),public.withdraw_availability(uuid),public.book_appointment(uuid,uuid,uuid),public.change_appointment(uuid,int,text,uuid,text) from public,rafik_guest;
grant execute on function public.availability_preview(timestamp,text,int,int,int),public.publish_availability(uuid,timestamp,text,int,int,int,text,text),public.withdraw_availability(uuid),public.book_appointment(uuid,uuid,uuid),public.change_appointment(uuid,int,text,uuid,text) to rafik_user;

-- Private immutable files with explicit sharing. Byte deletion always uses Storage API.
create table public.resources (
 id uuid primary key, owner_id uuid not null references public.profiles(id) on delete cascade,
 title text not null, filename text not null, media_type text not null, bytes bigint not null,
 object_path text not null unique, state text not null default 'pending' check(state in('pending','ready','retired')),
 revision int not null default 1, created_at timestamptz not null default now()
);
create table public.resource_shares (
 id uuid primary key default gen_random_uuid(), resource_id uuid not null references public.resources(id) on delete cascade,
 relationship_id uuid not null references public.coach_clients(id) on delete cascade,
 created_at timestamptz not null default now(),unique(resource_id,relationship_id)
);
alter table public.messages add column resource_id uuid references public.resources(id) on delete set null;
insert into file_store.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rafik-private','rafik-private',false,10485760,array['application/pdf','text/plain','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create function public.can_read_resource(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.resources r where r.id=p_id and (r.owner_id=identity.actor_id() or (r.state='ready' and exists(select 1 from public.resource_shares s join public.coach_clients c on c.id=s.relationship_id where s.resource_id=r.id and identity.actor_id() in(c.coach_id,c.client_id)))));
$$;
create function public.register_resource(p_id uuid,p_title text,p_filename text,p_type text,p_bytes bigint) returns public.resources
language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 perform id from public.profiles where id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into r from public.resources where id=p_id;
 if found then
  if r.owner_id<>identity.actor_id() then raise exception 'forbidden';end if;
  if r.title is distinct from trim(p_title) or r.filename is distinct from p_filename or r.media_type is distinct from p_type or r.bytes is distinct from p_bytes then raise exception 'conflict';end if;return r;
 end if;
 if char_length(trim(coalesce(p_title,''))) not between 1 and 120 or char_length(coalesce(p_filename,'')) not between 1 and 180
 or p_filename ~ '[[:cntrl:]/\\]' or coalesce(p_type,'') not in('application/pdf','text/plain','image/jpeg','image/png','image/webp') or p_bytes is null or p_bytes not between 1 and 10485760 then raise exception 'invalid_file';end if;
 insert into public.resources(id,owner_id,title,filename,media_type,bytes,object_path) values(p_id,identity.actor_id(),trim(p_title),p_filename,p_type,p_bytes,identity.actor_id()::text||'/'||p_id::text) returning * into r;return r;
end $$;
create function public.finish_resource(p_id uuid) returns public.resources language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources; o file_store.objects;begin
 select * into r from public.resources where id=p_id and owner_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 if r.state='ready' then return r;end if;if r.state<>'pending' then raise exception 'resource_unavailable';end if;
 select * into o from file_store.objects where bucket_id='rafik-private' and name=r.object_path;
 if not found then raise exception 'upload_incomplete';end if;
 if (o.metadata->>'size')::bigint is distinct from r.bytes or o.metadata->>'mimetype' is distinct from r.media_type then raise exception 'invalid_file';end if;
 update public.resources set state='ready',revision=revision+1 where id=p_id returning * into r;return r;
end $$;
create function public.share_resource(p_id uuid,p_relationship uuid,p_shared boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;c public.coach_clients;begin
 select * into c from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden';end if;
 select * into r from public.resources where id=p_id and owner_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;
 if p_shared is null then raise exception 'invalid_action';end if;
 if p_shared then
  if r.state<>'ready' or c.state<>'active' then raise exception 'resource_unavailable';end if;
  insert into public.resource_shares(resource_id,relationship_id) values(p_id,p_relationship) on conflict(resource_id,relationship_id) do nothing;
 else delete from public.resource_shares where resource_id=p_id and relationship_id=p_relationship;end if;
end $$;
create function public.retire_resource(p_id uuid,p_revision int) returns public.resources language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 select * into r from public.resources where id=p_id and owner_id=identity.actor_id() for update;
 if not found then raise exception 'forbidden';end if;if r.state='retired' then return r;end if;
 if r.revision is distinct from p_revision then raise exception 'conflict';end if;
 update public.resources set state='retired',revision=revision+1 where id=p_id returning * into r;return r;
end $$;
create function public.remove_resource_record(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 select * into r from public.resources where id=p_id for update;if not found then return;end if;
 if r.owner_id<>identity.actor_id() then raise exception 'forbidden';end if;
 if r.state<>'retired' or exists(select 1 from file_store.objects where bucket_id='rafik-private' and name=r.object_path) then raise exception 'file_cleanup_required';end if;
 delete from public.resources where id=p_id;
end $$;
-- Extend the explicit send payload. The sixth argument defaults to null for existing clients.
drop function public.send_message(uuid,uuid,text,uuid,uuid);
create function public.send_message(p_id uuid,p_relationship uuid,p_body text,p_session uuid default null,p_request uuid default null,p_resource uuid default null) returns public.messages
language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.messages;r public.coach_clients;begin
 select * into r from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id) for update;
 if not found then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into m from public.messages where id=p_id;
 if found then
  if m.sender_id<>identity.actor_id() or m.relationship_id<>p_relationship or m.body is distinct from trim(p_body) or m.session_id is distinct from p_session or m.request_id is distinct from p_request or m.resource_id is distinct from p_resource then raise exception 'conflict';end if;return m;
 end if;
 if r.state<>'active' then raise exception 'relationship_archived';end if;
 if char_length(trim(coalesce(p_body,''))) not between 1 and 4000 or (p_session is not null and p_request is not null) then raise exception 'invalid_message';end if;
 if p_session is not null and not exists(select 1 from public.sessions where id=p_session and coach_id=r.coach_id and client_id=r.client_id) then raise exception 'invalid_context';end if;
 if p_request is not null and not exists(select 1 from public.coaching_requests where id=p_request and relationship_id=r.id) then raise exception 'invalid_context';end if;
 if p_resource is not null and not exists(select 1 from public.resources f join public.resource_shares s on s.resource_id=f.id where f.id=p_resource and f.state='ready' and s.relationship_id=r.id) then raise exception 'resource_unavailable';end if;
 insert into public.messages(id,relationship_id,sender_id,body,session_id,request_id,resource_id) values(p_id,r.id,identity.actor_id(),trim(p_body),p_session,p_request,p_resource) returning * into m;return m;
end $$;
create or replace function public.delete_my_account(p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if identity.actor_id() is null then raise exception 'unauthenticated';end if;
 if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation';end if;
 perform id from public.profiles where id=identity.actor_id() for update;
 if exists(select 1 from public.resources where owner_id=identity.actor_id()) then raise exception 'file_cleanup_required';end if;
 -- Deleting a client must not leave their former coach's future availability booked forever.
 update public.appointment_slots set state='open' where starts_at>now() and id in(select a.slot_id from public.appointments a join public.coach_clients c on c.id=a.relationship_id where c.client_id=identity.actor_id() and a.state='booked');
 delete from identity.users where id=identity.actor_id();
end $$;
alter table public.resources enable row level security;
alter table public.resource_shares enable row level security;
create policy resources_read on public.resources for select to rafik_user using(public.can_read_resource(id));
create policy shares_participants on public.resource_shares for select to rafik_user using(exists(select 1 from public.coach_clients c where c.id=relationship_id and identity.actor_id() in(c.coach_id,c.client_id)));
-- Hold the registration row through Storage metadata insertion so retirement cannot
-- remove its record while a previously authorized upload is still committing.
create function public.can_upload_resource(p_path text) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 perform id from public.resources where object_path=p_path and owner_id=identity.actor_id() and state='pending' for share;
 return found;
end $$;
revoke all on function public.can_upload_resource(text) from public,rafik_guest;
grant execute on function public.can_upload_resource(text) to rafik_user;
create policy rafik_resource_read on file_store.objects for select to rafik_user using(bucket_id='rafik-private' and exists(select 1 from public.resources r where r.object_path=name and public.can_read_resource(r.id)));
create policy rafik_resource_upload on file_store.objects for insert to rafik_user with check(bucket_id='rafik-private' and public.can_upload_resource(name));
create policy rafik_resource_delete on file_store.objects for delete to rafik_user using(bucket_id='rafik-private' and exists(select 1 from public.resources r where r.object_path=name and r.owner_id=identity.actor_id() and r.state='retired'));
revoke all on public.resources,public.resource_shares from rafik_guest,rafik_user;
grant select on public.resources,public.resource_shares to rafik_user;
revoke all on function public.can_read_resource(uuid),public.register_resource(uuid,text,text,text,bigint),public.finish_resource(uuid),public.share_resource(uuid,uuid,boolean),public.retire_resource(uuid,int),public.remove_resource_record(uuid),public.send_message(uuid,uuid,text,uuid,uuid,uuid) from public,rafik_guest;
grant execute on function public.can_read_resource(uuid),public.register_resource(uuid,text,text,text,bigint),public.finish_resource(uuid),public.share_resource(uuid,uuid,boolean),public.retire_resource(uuid,int),public.remove_resource_record(uuid),public.send_message(uuid,uuid,text,uuid,uuid,uuid) to rafik_user;

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
 select case when t.owner_id=identity.actor_id() then 'owner' else m.role end from public.teams t join public.team_members m on m.team_id=t.id and m.user_id=identity.actor_id() and m.state='active' where t.id=p_team and not t.archived;
$$;
create function public.team_log(p_team uuid,p_action text,p_subject uuid default null) returns void language sql security definer set search_path=public,pg_temp as $$
 insert into public.team_activity(team_id,actor_id,action,subject_id) values(p_team,identity.actor_id(),p_action,p_subject);
$$;
create function public.create_team(p_id uuid,p_name text) returns public.teams language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.teams;begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into t from public.teams where id=p_id;
 if found then if t.owner_id<>identity.actor_id() or t.name is distinct from trim(p_name) then raise exception 'conflict';end if;return t;end if;
 insert into public.teams(id,owner_id,name) values(p_id,identity.actor_id(),trim(p_name)) returning * into t;
 insert into public.team_members(team_id,user_id,role) values(t.id,identity.actor_id(),'admin');
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
 if exists(select 1 from public.team_members m join identity.users u on u.id=m.user_id where m.team_id=p_team and m.state='active' and lower(u.email)=lower(trim(p_email))) then raise exception 'already_member';end if;
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
 if identity.actor_id() is null or not exists(select 1 from identity.users where id=identity.actor_id() and email_confirmed_at is not null and lower(email)=i.email) then raise exception 'wrong_email';end if;
 if i.state='accepted' and i.accepted_by=identity.actor_id() then return i.team_id;end if;
 if i.state<>'pending' or i.expires_at<=now() or exists(select 1 from public.teams where id=i.team_id and archived) then raise exception 'invitation_unavailable';end if;
 perform public.require_team_growth(i.team_id,'accept_staff');
 insert into public.team_members(team_id,user_id,role) values(i.team_id,identity.actor_id(),i.role) on conflict(team_id,user_id) do update set state='active',role=excluded.role;
 update public.team_invitations set state='accepted',accepted_by=identity.actor_id() where id=i.id;
 perform public.team_log(i.team_id,'staff_joined',identity.actor_id());return i.team_id;
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
  if p_action='owner' and exists(select 1 from public.team_activity where team_id=p_team and actor_id=identity.actor_id() and action='member_owner' and subject_id=p_user) then return;end if;
  raise exception 'transfer_owner_first';
 end if;
 if m.state='removed' then
  if p_action='remove' and (identity.actor_id()=p_user or public.team_role(p_team) in('owner','admin')) then return;end if;
  raise exception 'forbidden';
 end if;
 if p_action='remove' then
  if identity.actor_id()<>p_user and coalesce(public.team_role(p_team),'') not in('owner','admin') then raise exception 'forbidden';end if;
  if identity.actor_id()<>t.owner_id and identity.actor_id()<>p_user and m.role='admin' then raise exception 'forbidden';end if;
  if exists(select 1 from public.team_clients where team_id=p_team and state<>'closed' and (coach_id=p_user or pending_coach_id=p_user)) then raise exception 'reassign_clients_first';end if;
  update public.team_members set state='removed' where id=m.id;
 elsif p_action in('admin','coach') then
  if identity.actor_id()<>t.owner_id then raise exception 'forbidden';end if;
  update public.team_members set role=p_action where id=m.id;
 elsif p_action='owner' then
  if identity.actor_id()<>t.owner_id then raise exception 'forbidden';end if;
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
 if not found or t.owner_id<>identity.actor_id() then raise exception 'forbidden';end if;
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
 select * into c from public.coach_clients where id=p_relationship and coach_id=identity.actor_id() and state='active' for update;
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
 select * into e from public.team_clients where id=p_id and client_id=identity.actor_id();
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
 if not found or (identity.actor_id() is distinct from e.coach_id and identity.actor_id() is distinct from e.client_id and coalesce(public.team_role(e.team_id),'') not in('owner','admin')) then raise exception 'forbidden';end if;
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
 if found then if t.team_id<>p_team or t.contributor_id<>identity.actor_id() or t.source_id is distinct from p_version then raise exception 'conflict';end if;return t;end if;
 perform public.require_team_growth(p_team,'write');select * into v from public.plan_versions where id=p_version and coach_id=identity.actor_id();
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
 insert into public.team_plans(id,team_id,contributor_id,source_id,title,prescription) values(p_id,p_team,identity.actor_id(),v.id,v.title,v.prescription) returning * into t;
 perform public.team_log(p_team,'plan_shared',t.id);return t;
end $$;
create function public.remove_team_plan(p_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.team_plans;begin
 select * into t from public.team_plans where id=p_id;perform id from public.teams where id=t.team_id for update;
 if public.team_role(t.team_id) is null or (t.contributor_id is distinct from identity.actor_id() and public.team_role(t.team_id) not in('owner','admin')) then raise exception 'forbidden';end if;
 update public.team_plans set archived=true where id=p_id;perform public.team_log(t.team_id,'plan_removed',p_id);
end $$;
create function public.import_team_plan(p_id uuid,p_template uuid) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare t public.team_plans;p public.plans;begin
 select * into t from public.team_plans where id=p_template;perform id from public.teams where id=t.team_id for update;
 if public.team_role(t.team_id) is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into p from public.plans where id=p_id;
 if found then if p.coach_id<>identity.actor_id() or p.team_template_id is distinct from p_template then raise exception 'conflict';end if;return p;end if;
 if t.archived then raise exception 'plan_unavailable';end if;
 p:=public.copy_snapshot_plan(p_id,identity.actor_id(),t.title,t.prescription,t.id);perform public.team_log(t.team_id,'plan_imported',p.id);return p;
end $$;
create function public.assign_team_group(p_id uuid,p_group uuid,p_version uuid,p_clients uuid[]) returns public.team_assignments language plpgsql security definer set search_path=public,pg_temp as $$
declare g public.team_groups;r public.team_assignments;e public.team_clients;ids uuid[];begin
 select * into g from public.team_groups where id=p_group;perform id from public.teams where id=g.team_id for update;
 if public.team_role(g.team_id) is null then raise exception 'forbidden';end if;
 select array_agg(distinct x order by x) into ids from unnest(p_clients) x;
 select * into r from public.team_assignments where id=p_id;
 if found then if r.actor_id<>identity.actor_id() or r.group_id<>p_group or r.version_id is distinct from p_version or r.client_ids is distinct from ids then raise exception 'conflict';end if;return r;end if;
 if g.archived then raise exception 'group_unavailable';end if;
 perform public.require_team_growth(g.team_id,'write');
 if coalesce(cardinality(ids),0) not between 1 and 50 or not exists(select 1 from public.plan_versions where id=p_version and coach_id=identity.actor_id()) then raise exception 'invalid_assignment';end if;
 if exists(select 1 from unnest(ids) x where not exists(select 1 from public.team_clients c join public.team_group_members m on m.client_id=c.id where c.id=x and c.team_id=g.team_id and c.coach_id=identity.actor_id() and c.state='active' and m.group_id=p_group)) then raise exception 'forbidden';end if;
 for e in select * from public.team_clients where id=any(ids) order by relationship_id loop perform public.assign_plan(e.relationship_id,p_version);end loop;
 insert into public.team_assignments(id,group_id,actor_id,version_id,client_ids) values(p_id,p_group,identity.actor_id(),p_version,ids) returning * into r;
 perform public.team_log(g.team_id,'group_assigned',r.id);return r;
end $$;
create function public.share_team_resource(p_team uuid,p_resource uuid,p_shared boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.resources;begin
 perform id from public.teams where id=p_team for update;
 select * into r from public.resources where id=p_resource for update;
 if not found or (r.owner_id<>identity.actor_id() and (p_shared or coalesce(public.team_role(p_team),'') not in('owner','admin'))) then raise exception 'forbidden';end if;
 if p_shared is null then raise exception 'invalid_action';end if;
 if p_shared and public.team_role(p_team) is null then raise exception 'forbidden';end if;
 if p_shared then
  perform public.require_team_growth(p_team,'write');if r.state<>'ready' then raise exception 'resource_unavailable';end if;
  insert into public.team_resource_shares(team_id,resource_id) values(p_team,p_resource) on conflict do nothing;
 else delete from public.team_resource_shares where team_id=p_team and resource_id=p_resource;end if;
end $$;
create function public.my_resource_teams() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('resource_id',r.id,'team_id',t.id,'team_name',t.name,'archived',t.archived)),'[]'::jsonb) from public.resources r join public.team_resource_shares s on s.resource_id=r.id join public.teams t on t.id=s.team_id where r.owner_id=identity.actor_id();
$$;
create or replace function public.can_read_resource(p_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.resources r where r.id=p_id and (r.owner_id=identity.actor_id() or (r.state='ready' and (exists(select 1 from public.resource_shares s join public.coach_clients c on c.id=s.relationship_id where s.resource_id=r.id and identity.actor_id() in(c.coach_id,c.client_id)) or exists(select 1 from public.team_resource_shares s where s.resource_id=r.id and public.team_role(s.team_id) is not null)))));
$$;
create function public.team_workspace(p_team uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare role text:=public.team_role(p_team);begin
 if role is null then raise exception 'forbidden';end if;
 return jsonb_build_object(
 'team',(select to_jsonb(t)||jsonb_build_object('role',role) from public.teams t where id=p_team),
 'members',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('name',p.display_name) order by p.display_name) from public.team_members m join public.profiles p on p.id=m.user_id where m.team_id=p_team and m.state='active'),'[]'::jsonb),
 'invitations',case when role in('owner','admin') then coalesce((select jsonb_agg(to_jsonb(i)-'token_hash' order by expires_at desc) from public.team_invitations i where team_id=p_team and state='pending' and expires_at>now()),'[]'::jsonb) else '[]'::jsonb end,
 'clients',coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('name',p.display_name,'coach_name',q.display_name,'pending_name',n.display_name) order by p.display_name) from public.team_clients c join public.profiles p on p.id=c.client_id left join public.profiles q on q.id=c.coach_id left join public.profiles n on n.id=c.pending_coach_id where c.team_id=p_team and c.state<>'closed' and (role in('owner','admin') or identity.actor_id()=c.coach_id)),'[]'::jsonb),
 'groups',coalesce((select jsonb_agg(to_jsonb(g) order by name) from public.team_groups g where team_id=p_team and not archived),'[]'::jsonb),
 'group_members',coalesce((select jsonb_agg(to_jsonb(m)) from public.team_group_members m join public.team_groups g on g.id=m.group_id join public.team_clients c on c.id=m.client_id where g.team_id=p_team and (role in('owner','admin') or identity.actor_id()=c.coach_id)),'[]'::jsonb),
 'plans',coalesce((select jsonb_agg(to_jsonb(p)-'prescription' order by created_at desc) from public.team_plans p where team_id=p_team and not archived),'[]'::jsonb),
 'resources',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.resources r join public.team_resource_shares s on s.resource_id=r.id where s.team_id=p_team and r.state='ready'),'[]'::jsonb),
 'activity',case when role in('owner','admin') then coalesce((select jsonb_agg(to_jsonb(a)) from (select * from public.team_activity where team_id=p_team order by created_at desc limit 30) a),'[]'::jsonb) else '[]'::jsonb end);
end $$;
create function public.my_team_enrollments() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(to_jsonb(c)||jsonb_build_object('team_name',t.name,'coach_name',p.display_name,'pending_name',q.display_name) order by c.created_at desc),'[]'::jsonb) from public.team_clients c join public.teams t on t.id=c.team_id left join public.profiles p on p.id=c.coach_id left join public.profiles q on q.id=c.pending_coach_id where c.client_id=identity.actor_id() and c.state<>'closed' and not t.archived;
$$;
-- Only scoped data is directly readable. Sensitive coaching policies stay unchanged.
alter table public.teams enable row level security;
create policy teams_members on public.teams for select to rafik_user using(public.team_role(id) is not null);
alter table public.team_members enable row level security;
create policy members_team on public.team_members for select to rafik_user using(public.team_role(team_id) is not null);
alter table public.team_invitations enable row level security;
create policy invites_admin on public.team_invitations for select to rafik_user using(public.team_role(team_id) in('owner','admin'));
alter table public.team_clients enable row level security;
create policy clients_scoped on public.team_clients for select to rafik_user using(client_id=identity.actor_id() or (public.team_role(team_id) is not null and (coach_id=identity.actor_id() or public.team_role(team_id) in('owner','admin'))));
alter table public.team_groups enable row level security;
create policy groups_team on public.team_groups for select to rafik_user using(public.team_role(team_id) is not null);
alter table public.team_group_members enable row level security;
create policy group_members_scoped on public.team_group_members for select to rafik_user using(exists(select 1 from public.team_clients c where c.id=client_id and public.team_role(c.team_id) is not null and (c.coach_id=identity.actor_id() or public.team_role(c.team_id) in('owner','admin'))));
alter table public.team_plans enable row level security;
create policy plans_team on public.team_plans for select to rafik_user using(public.team_role(team_id) is not null);
alter table public.team_resource_shares enable row level security;
create policy resource_team on public.team_resource_shares for select to rafik_user using(public.team_role(team_id) is not null);
alter table public.team_assignments enable row level security;
create policy group_assignments_scoped on public.team_assignments for select to rafik_user using(actor_id=identity.actor_id() or exists(select 1 from public.team_groups g where g.id=group_id and public.team_role(g.team_id) in('owner','admin')));
alter table public.team_activity enable row level security;
create policy activity_admin on public.team_activity for select to rafik_user using(public.team_role(team_id) in('owner','admin'));
revoke all on public.teams,public.team_members,public.team_invitations,public.team_clients,public.team_groups,public.team_group_members,public.team_plans,public.team_resource_shares,public.team_assignments,public.team_activity from rafik_guest,rafik_user;
grant select on public.teams,public.team_members,public.team_invitations,public.team_clients,public.team_groups,public.team_group_members,public.team_plans,public.team_resource_shares,public.team_assignments,public.team_activity to rafik_user;

do $$ declare f record;begin
 for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in('team_role','team_log','create_team','invite_team_member','team_invitation','accept_team_invitation','revoke_team_invitation','change_team_member','rename_team','close_team','propose_team_client','request_team_handoff','copy_snapshot_plan','respond_team_client','close_team_client','save_team_group','archive_team_group','set_team_group_client','share_team_plan','remove_team_plan','import_team_plan','assign_team_group','share_team_resource','my_resource_teams','can_read_resource','team_workspace','my_team_enrollments') loop
  execute format('revoke all on function %s from public,rafik_guest,rafik_user',f.signature);
  if f.proname not in('team_log','require_team_growth','apply_business_event','operator_support_reply','copy_snapshot_plan') then execute format('grant execute on function %s to rafik_user',f.signature);end if;
 end loop;
end $$;
grant execute on function public.team_invitation(text) to rafik_guest;

-- Handoff cannot invalidate retrying a session that already started.
create or replace function public.start_session(p_id uuid,p_version_id uuid,p_day_id text,p_assignment_id uuid default null,p_scheduled_date date default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v public.plan_versions; a public.assignments; d jsonb; e jsonb; s public.sessions; local_day date; preferred_unit text; occurrence text; c public.coach_clients; target jsonb; scheduled date; projection jsonb;
begin
  if identity.actor_id() is null then raise exception 'unauthenticated'; end if;
  -- Recover an acknowledged-in-the-database start even if a handoff/archive followed it.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text,2));
  select * into s from public.sessions where id=p_id;
  if found then
    if s.client_id<>identity.actor_id() then raise exception 'forbidden';end if;
    if s.day_id is distinct from p_day_id or (s.version_id is not null and s.version_id is distinct from p_version_id) or (s.assignment_id is not null and s.assignment_id is distinct from p_assignment_id) then raise exception 'conflict';end if;
    return public.session_document(s.id);
  end if;
  select (now() at time zone timezone)::date,units into local_day,preferred_unit from public.profiles where id=identity.actor_id();
  if not found then raise exception 'profile_required'; end if;
  if p_assignment_id is not null then
    select c0.* into c from public.coach_clients c0 join public.assignments a0 on a0.relationship_id=c0.id where a0.id=p_assignment_id and a0.client_id=identity.actor_id() for update of c0;
    if not found or c.state<>'active' then raise exception 'assignment_unavailable'; end if;
    select * into a from public.assignments where id=p_assignment_id and client_id=identity.actor_id() and state='active' for update;
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
    values(p_id,identity.actor_id(),a.coach_id,a.id,v.id,p_day_id,occurrence,local_day,v.title,d)
    on conflict(client_id,occurrence_key) do nothing returning * into s;
  if not found then select * into s from public.sessions where client_id=identity.actor_id() and occurrence_key=occurrence; end if;
  for e in select value from jsonb_array_elements(s.prescription->'exercises') loop
    for n in 0..(e->>'sets')::int-1 loop
      target:=coalesce(e->'targets'->n,e);
      insert into public.set_entries(session_id,exercise_key,set_index,reps,load,unit,seconds,metres,effort)
        values(s.id,e->>'key',n,(target->>'reps')::int,round((target->>'load')::numeric * case when preferred_unit=e->>'unit' then 1 when preferred_unit='lb' then 2.2046226218 else 1/2.2046226218 end,2),preferred_unit,(target->>'seconds')::int,(target->>'metres')::numeric,null) on conflict do nothing;
    end loop;
  end loop;
  return public.session_document(s.id);
end $$;

-- Provider state is separate from training. Local simulations default off on new hosting.
create table public.runtime_settings(id boolean primary key default true check(id),local_simulation boolean not null default false);
insert into public.runtime_settings(id) values(true);
alter table public.runtime_settings enable row level security;
revoke all on public.runtime_settings from public,rafik_guest,rafik_user;
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
 select exists(select 1 from public.business_accounts where id=p_account and (owner_id=identity.actor_id() or public.team_role(team_id) in('owner','admin')));
$$;
create function public.open_business_account(p_id uuid,p_team uuid default null) returns public.business_accounts language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.business_accounts;begin
 if identity.actor_id() is null or (p_team is not null and public.team_role(p_team)<>'owner') then raise exception 'forbidden';end if;
 if p_team is not null and public.team_role(p_team) is null then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(p_team,identity.actor_id())::text,1));
 select * into a from public.business_accounts where (p_team is null and owner_id=identity.actor_id()) or team_id=p_team;
 if found then return a;end if;
 insert into public.business_accounts(id,owner_id,team_id) values(p_id,case when p_team is null then identity.actor_id() end,p_team) returning * into a;return a;
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
 if not found or not (coalesce(a.owner_id=identity.actor_id(),false) or coalesce(public.team_role(a.team_id),'')='owner') then raise exception 'forbidden';end if;
 return public.apply_business_event(p_id,p_account,p_sequence,p_payload);
end $$;
create function public.create_support_case(p_id uuid,p_team uuid,p_subject text,p_detail text) returns public.support_cases language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_cases;begin
 if identity.actor_id() is null then raise exception 'forbidden';end if;
 if p_team is not null and public.team_role(p_team) is null and not exists(select 1 from public.team_clients where team_id=p_team and client_id=identity.actor_id() and state='active') then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));select * into c from public.support_cases where id=p_id;
 if found then if c.reporter_id<>identity.actor_id() or c.team_id is distinct from p_team or c.subject is distinct from trim(p_subject) or c.detail is distinct from trim(p_detail) then raise exception 'conflict';end if;return c;end if;
 insert into public.support_cases(id,reporter_id,team_id,subject,detail) values(p_id,identity.actor_id(),p_team,trim(p_subject),trim(p_detail)) returning * into c;return c;
end $$;
create function public.update_support_case(p_id uuid,p_revision int,p_state text,p_reply text default null) returns public.support_cases language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.support_cases;begin
 select * into c from public.support_cases where id=p_id for update;
 if not found or (c.reporter_id<>identity.actor_id() and coalesce(public.team_role(c.team_id),'') not in('owner','admin')) then raise exception 'forbidden';end if;
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
 if identity.actor_id() is null then raise exception 'unauthenticated';end if;
 if exists(select 1 from public.teams where owner_id=identity.actor_id() and not archived) then raise exception 'transfer_owner_first';end if;
 if exists(select 1 from public.team_clients where state<>'closed' and (coach_id=identity.actor_id() or pending_coach_id=identity.actor_id())) then raise exception 'reassign_clients_first';end if;
end $$;
create or replace function public.delete_my_account(p_confirmation text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if p_confirmation is distinct from 'DELETE' then raise exception 'invalid_confirmation';end if;
 -- Teams are locked before profile locks, matching team commands' lock order.
 perform id from public.teams where id in(select team_id from public.team_members where user_id=identity.actor_id()) order by id for update;
 perform public.account_deletion_ready();
 perform id from public.profiles where id=identity.actor_id() for update;
 if exists(select 1 from public.resources where owner_id=identity.actor_id()) then raise exception 'file_cleanup_required';end if;
 update public.appointment_slots set state='open' where starts_at>now() and id in(select a.slot_id from public.appointments a join public.coach_clients c on c.id=a.relationship_id where c.client_id=identity.actor_id() and a.state='booked');
 delete from identity.users where id=identity.actor_id();
end $$;
alter table public.business_accounts enable row level security;
create policy business_owner on public.business_accounts for select to rafik_user using(public.business_access(id));
alter table public.business_events enable row level security;
create policy events_owner on public.business_events for select to rafik_user using(public.business_access(account_id));
alter table public.support_cases enable row level security;
create policy support_participants on public.support_cases for select to rafik_user using(reporter_id=identity.actor_id() or public.team_role(team_id) in('owner','admin'));
revoke all on public.business_accounts,public.business_events,public.support_cases from rafik_guest,rafik_user;
grant select on public.business_accounts,public.business_events,public.support_cases to rafik_user;

do $$ declare f record;begin
 for f in select oid::regprocedure as signature,proname from pg_proc where pronamespace='public'::regnamespace and proname in('business_access','open_business_account','require_team_growth','apply_business_event','simulate_business_event','create_support_case','update_support_case','operator_support_reply','account_deletion_ready','delete_my_account') loop
  execute format('revoke all on function %s from public,rafik_guest,rafik_user',f.signature);
  if f.proname not in('team_log','require_team_growth','apply_business_event','operator_support_reply','copy_snapshot_plan') then execute format('grant execute on function %s to rafik_user',f.signature);end if;
 end loop;
end $$;
grant execute on function public.apply_business_event(uuid,uuid,bigint,jsonb),public.operator_support_reply(uuid,int,text) to rafik_service;

-- R5: immutable coach-approved alternatives, separately recorded actual choices.
-- Existing sessions and device operations remain valid without exercise_id.
alter table public.set_entries add column exercise_id text;

create or replace function public.validate_prescription(p jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare alt jsonb; alt_ids text[]; d jsonb; e jsonb; target jsonb; day_ids text[]:=array[]::text[]; slots text[]:=array[]::text[]; keys text[]; slot text; kind text; training int:=0;
begin
 if jsonb_typeof(p) is distinct from 'object' or coalesce(p->>'schema','') not in('1','2') or jsonb_typeof(p->'days') is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p->'days') not between 1 and 84 or coalesce((p->>'cycleWeeks')::int,1) not between 1 and 12 then raise exception 'invalid_day_count'; end if;
 for d in select value from jsonb_array_elements(p->'days') loop
  if nullif(d->>'id','') is null or d->>'id'=any(day_ids) or length(coalesce(d->>'name','')) not between 1 and 80
   or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'invalid_day'; end if;
  day_ids:=array_append(day_ids,d->>'id'); keys:=array[]::text[];
  if p->>'schema'='2' then
   if coalesce((d->>'week')::int,0) not between 1 and coalesce((p->>'cycleWeeks')::int,1) or coalesce((d->>'weekday')::int,-1) not between 0 and 6 then raise exception 'invalid_schedule'; end if;
   slot:=(d->>'week')||':'||(d->>'weekday');
   if slot=any(slots) then raise exception 'invalid_duplicate_day'; end if;
   slots:=array_append(slots,slot);
  end if;
  if coalesce((d->>'restDay')::boolean,false) then
   if jsonb_array_length(d->'exercises')<>0 then raise exception 'invalid_rest_day'; end if;
   continue;
  end if;
  training:=training+1;
  if jsonb_array_length(d->'exercises') not between 1 and 12 then raise exception 'invalid_exercise_count'; end if;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   kind:=coalesce(e->>'kind','strength');
   if nullif(e->>'key','') is null or e->>'key'=any(keys)
    or not exists(select 1 from public.exercises x where x.id=e->>'exerciseId' and x.active and (x.owner_id is null or x.owner_id=identity.actor_id()))
    or coalesce((e->>'sets')::int,0) not between 1 and 10 or kind not in('strength','timed','distance')
    or coalesce((e->>'reps')::int,0) not between 1 and 100 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
    or coalesce(e->>'unit','') not in('kg','lb') or coalesce((e->>'rest')::int,-1) not between 0 and 600
    or length(coalesce(e->>'note',''))>500 or length(coalesce(e->>'group',''))>40 then raise exception 'invalid_exercise'; end if;
   if e ? 'targets' and (jsonb_typeof(e->'targets') is distinct from 'array' or jsonb_array_length(e->'targets')<>(e->>'sets')::int) then raise exception 'invalid_targets'; end if;
   for target in select value from jsonb_array_elements(coalesce(e->'targets',jsonb_build_array(e))) loop
    if coalesce((target->>'reps')::int,0) not between 1 and 100 or coalesce((target->>'load')::numeric,-1) not between 0 and 1000
      or (kind='timed' and coalesce((target->>'seconds')::int,0) not between 1 and 86400)
      or (kind='distance' and coalesce((target->>'metres')::numeric,0) not between 1 and 1000000)
      or (target->>'effort' is not null and (target->>'effort')::numeric not between 1 and 10) then raise exception 'invalid_target'; end if;
   end loop;
   if e ? 'alternatives' then
    if jsonb_typeof(e->'alternatives') is distinct from 'array' or jsonb_array_length(e->'alternatives')>3 then raise exception 'invalid_alternatives'; end if;
    alt_ids:=array[e->>'exerciseId'];
    for alt in select value from jsonb_array_elements(e->'alternatives') loop
     if jsonb_typeof(alt) is distinct from 'object' or nullif(alt->>'exerciseId','') is null or alt->>'exerciseId'=any(alt_ids)
      or not exists(select 1 from public.exercises x where x.id=alt->>'exerciseId' and x.active and (x.owner_id is null or x.owner_id=identity.actor_id()) and x.kind=coalesce(e->>'kind','strength')) then raise exception 'invalid_alternative'; end if;
     alt_ids:=array_append(alt_ids,alt->>'exerciseId');
    end loop;
   end if;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;

create or replace function public.snapshot_prescription(p jsonb) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 select jsonb_set(p,'{days}',(select jsonb_agg(jsonb_set(d.value,'{exercises}',coalesce((select jsonb_agg(
 e.value||jsonb_build_object('info',to_jsonb(x)-'owner_id'-'revision'-'active','alternatives',coalesce((
 select jsonb_agg(jsonb_build_object('exerciseId',a.value->>'exerciseId','info',to_jsonb(y)-'owner_id'-'revision'-'active') order by a.n)
 from jsonb_array_elements(coalesce(e.value->'alternatives','[]'::jsonb)) with ordinality a(value,n) join public.exercises y on y.id=a.value->>'exerciseId'),'[]'::jsonb))
 order by e.n) from jsonb_array_elements(d.value->'exercises') with ordinality e(value,n) join public.exercises x on x.id=e.value->>'exerciseId'),'[]'::jsonb)) order by d.n) from jsonb_array_elements(p->'days') with ordinality d(value,n)));
$$;

-- Pure projection only: preserve prescribed targets/key, substitute snapshotted identity.
create function public.performed_exercise(p jsonb,p_choice text) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select coalesce((select p || jsonb_build_object('exerciseId',a->>'exerciseId','info',a->'info') from jsonb_array_elements(coalesce(p->'alternatives','[]'::jsonb)) a where a->>'exerciseId'=p_choice),p);
$$;
revoke all on function public.performed_exercise(jsonb,text) from public,rafik_guest;
grant execute on function public.performed_exercise(jsonb,text) to rafik_user;

create or replace function public.save_session(p_id uuid,p_expected_version int,p_operation_id uuid,p_entries jsonb,p_note text,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare s public.sessions; op public.session_operations; h text; e jsonb; result jsonb; expected_count int; kind text; prescribed jsonb; choice text;
begin
  select * into s from public.sessions where id=p_id and client_id=identity.actor_id() for update;
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
  if exists(select 1 from jsonb_array_elements(p_entries) x group by x->>'exercise_key' having count(distinct coalesce(x->>'exercise_id',''))>1) then raise exception 'inconsistent_exercise_choice'; end if;
  for e in select value from jsonb_array_elements(p_entries) loop
    select x,coalesce(x->>'kind','strength') into prescribed,kind from jsonb_array_elements(s.prescription->'exercises') x where x->>'key'=e->>'exercise_key';
    if not exists(select 1 from public.set_entries where session_id=p_id and exercise_key=e->>'exercise_key' and set_index=(e->>'set_index')::int)
      or coalesce((e->>'reps')::int,-1) not between 0 and 200 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
      or coalesce(e->>'unit','') not in ('kg','lb') or jsonb_typeof(e->'completed') is distinct from 'boolean'
      or (e->>'seconds' is not null and (e->>'seconds')::int not between 0 and 86400)
      or (e->>'metres' is not null and (e->>'metres')::numeric not between 0 and 1000000)
      or (e->>'effort' is not null and (e->>'effort')::numeric not between 1 and 10)
      or ((e->>'completed')::boolean and ((kind='strength' and (e->>'reps')::int<1) or (kind='timed' and coalesce((e->>'seconds')::int,0)<1) or (kind='distance' and coalesce((e->>'metres')::numeric,0)<1))) then raise exception 'invalid_entry'; end if;
    choice:=nullif(e->>'exercise_id','');
    if choice is not null and choice<>prescribed->>'exerciseId' and not exists(select 1 from jsonb_array_elements(coalesce(prescribed->'alternatives','[]'::jsonb)) a where a->>'exerciseId'=choice) then raise exception 'invalid_exercise_choice'; end if;
    update public.set_entries set exercise_id=choice,reps=(e->>'reps')::int,load=(e->>'load')::numeric,unit=e->>'unit',completed=(e->>'completed')::boolean,seconds=(e->>'seconds')::int,metres=(e->>'metres')::numeric,effort=(e->>'effort')::numeric
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

create or replace function public.previous_performance(p_exercises text[],p_before timestamptz) returns jsonb
language sql stable set search_path=public,pg_temp as $$
 with performed as (
 select s.id,s.completed_at,public.performed_exercise(x,(select e.exercise_id from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' order by e.set_index limit 1)) as prescription
 from public.sessions s cross join jsonb_array_elements(s.prescription->'exercises') x
 where s.client_id=identity.actor_id() and s.status='completed' and s.completed_at<p_before
 and exists(select 1 from public.set_entries e where e.session_id=s.id and e.exercise_key=x->>'key' and e.completed)
 ), latest as (
 select distinct on (prescription->>'exerciseId') prescription->>'exerciseId' as exercise_id,id,completed_at,prescription
 from performed where prescription->>'exerciseId'=any(p_exercises[1:48]) order by prescription->>'exerciseId',completed_at desc,id
 ) select coalesce(jsonb_agg(jsonb_build_object('exercise_id',l.exercise_id,'completed_at',l.completed_at,'prescription',l.prescription,'entries',(select jsonb_agg(to_jsonb(e) order by e.set_index) from public.set_entries e where e.session_id=l.id and e.exercise_key=l.prescription->>'key' and e.completed))),'[]'::jsonb) from latest l;
$$;

create or replace function public.training_progress(p_relationship uuid,p_from date,p_to date) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.coach_clients; client uuid:=identity.actor_id(); result jsonb;begin
 if client is null then raise exception 'forbidden'; end if;
 if p_relationship is not null then
 select * into c from public.coach_clients where id=p_relationship and identity.actor_id() in(coach_id,client_id);
 if not found then raise exception 'forbidden'; end if; client:=c.client_id;
 end if;
 if p_from is null or p_to is null or p_to<p_from or p_to-p_from>365 then raise exception 'invalid_window'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'date',s.local_date,'title',s.title,'exercises',(
 select coalesce(jsonb_agg(jsonb_build_object('id',e->>'exerciseId','name',coalesce(e#>>'{info,name}',(select name from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'name_ar',coalesce(e#>>'{info,name_ar}',e#>>'{info,name}',(select name_ar from public.exercises where id=e->>'exerciseId'),e->>'exerciseId'),'kind',coalesce(e->>'kind','strength'),
 'sets',(select coalesce(jsonb_agg(to_jsonb(x)-'session_id' order by x.set_index),'[]'::jsonb) from public.set_entries x where x.session_id=s.id and x.exercise_key=e->>'key' and x.completed))),'[]'::jsonb) from jsonb_array_elements(s.prescription->'exercises') original cross join lateral (select public.performed_exercise(original,(select x.exercise_id from public.set_entries x where x.session_id=s.id and x.exercise_key=original->>'key' order by x.set_index limit 1)) as e) actual
 )) order by s.local_date,s.completed_at),'[]'::jsonb) into result from public.sessions s
 where s.client_id=client and (p_relationship is null or s.coach_id=c.coach_id) and s.status='completed' and s.local_date between p_from and p_to; return result;
end $$;


create or replace function public.copy_snapshot_plan(p_id uuid,p_owner uuid,p_title text,p_snapshot jsonb,p_template uuid default null) returns public.plans language plpgsql security definer set search_path=public,pg_temp as $$
declare alt jsonb; alt_info jsonb; alt_id text; alternatives jsonb; p public.plans; d jsonb; e jsonb; info jsonb; new_id text; days jsonb:='[]'::jsonb; entries jsonb; draft jsonb:=p_snapshot;begin
 for d in select value from jsonb_array_elements(p_snapshot->'days') loop
  entries:='[]'::jsonb;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   info:=e->'info';if info is null then select to_jsonb(x) into info from public.exercises x where id=e->>'exerciseId';end if;
   if info is null then raise exception 'missing_exercise_snapshot';end if;
   new_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(e->>'exerciseId','sha256'),'hex'),1,16);
   insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
   values(new_id,p_owner,info->>'name',coalesce(info->>'name_ar',info->>'name'),coalesce(info->>'equipment',''),coalesce(info->>'equipment_ar',''),coalesce(info->>'instructions',''),coalesce(info->>'instructions_ar',''),coalesce(info->>'movement','other'),coalesce(info->>'kind',e->>'kind','strength'),info->>'media_url') on conflict(id) do nothing;
   alternatives:='[]'::jsonb;
   for alt in select value from jsonb_array_elements(coalesce(e->'alternatives','[]'::jsonb)) loop
    alt_info:=alt->'info';
    if alt_info is null then raise exception 'missing_exercise_snapshot';end if;
    alt_id:='copy-'||p_id::text||'-'||substr(encode(extensions.digest(alt->>'exerciseId','sha256'),'hex'),1,16);
    insert into public.exercises(id,owner_id,name,name_ar,equipment,equipment_ar,instructions,instructions_ar,movement,kind,media_url)
    values(alt_id,p_owner,alt_info->>'name',coalesce(alt_info->>'name_ar',alt_info->>'name'),coalesce(alt_info->>'equipment',''),coalesce(alt_info->>'equipment_ar',''),coalesce(alt_info->>'instructions',''),coalesce(alt_info->>'instructions_ar',''),coalesce(alt_info->>'movement','other'),coalesce(alt_info->>'kind','strength'),alt_info->>'media_url') on conflict(id) do nothing;
    alternatives:=alternatives||jsonb_build_array(jsonb_build_object('exerciseId',alt_id));
   end loop;
   e:=jsonb_set(e,'{alternatives}',alternatives);
   entries:=entries||jsonb_build_array(jsonb_set(e-'info','{exerciseId}',to_jsonb(new_id)));
  end loop;
  days:=days||jsonb_build_array(jsonb_set(d,'{exercises}',entries));
 end loop;
 draft:=jsonb_set(draft,'{days}',days);
 insert into public.plans(id,coach_id,title,draft,team_template_id) values(p_id,p_owner,p_title,draft,p_template) returning * into p;return p;
end $$;



-- Read projections only: source records remain authoritative. Invoker functions retain RLS.
create index if not exists sessions_pending_review on public.sessions(coach_id,completed_at,id) where status='completed' and reviewed_at is null;
create index if not exists sessions_client_feedback on public.sessions(client_id,reviewed_at desc) where coach_note<>'';
drop function if exists public.coach_attention(text,timestamptz,text,int);
create or replace function public.coach_attention(p_kind text default 'all',p_after_time timestamptz default null,p_after_key text default '',p_limit int default 12,p_search text default '')
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if identity.actor_id() is null then raise exception 'forbidden'; end if;
 if length(p_search)>100 or p_kind not in('all','workout','checkin','message') or p_limit not between 1 and 50 or p_limit is null then raise exception 'invalid_filter'; end if;
 with tasks as (
 select 'workout:'||s.id as key,'workout'::text as kind,s.id,c.id relationship_id,p.display_name as name,s.prescription->>'name' as title,s.completed_at as happened_at,0::bigint unread,s.note as detail
 from sessions s join coach_clients c on c.coach_id=s.coach_id and c.client_id=s.client_id join profiles p on p.id=s.client_id
 where s.coach_id=identity.actor_id() and s.status='completed' and s.reviewed_at is null
 union all
 select 'checkin:'||q.id,'checkin',q.id,c.id,p.display_name,q.title,q.submitted_at,0::bigint,''::text
 from coaching_requests q join coach_clients c on c.id=q.relationship_id join profiles p on p.id=c.client_id
 where c.coach_id=identity.actor_id() and q.submitted_at is not null and q.reviewed_at is null and not q.cancelled
 union all
 select 'message:'||c.id,'message',c.id,c.id,p.display_name,''::text,max(m.created_at),count(*),''::text
 from coach_clients c join profiles p on p.id=c.client_id join messages m on m.relationship_id=c.id and m.sender_id<>identity.actor_id()
 left join conversation_reads r on r.relationship_id=c.id and r.user_id=identity.actor_id()
 where c.coach_id=identity.actor_id() and m.sequence>coalesce(r.last_sequence,0) group by c.id,p.display_name
 ), filtered as (select * from tasks where (p_kind='all' or kind=p_kind) and strpos(lower(name||' '||title||' '||detail),lower(trim(p_search)))>0), page as (
 select * from filtered where p_after_time is null or (happened_at,key)>(p_after_time,p_after_key) order by happened_at,key limit p_limit
 ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(page) order by happened_at,key) from page),'[]'),
 'total',(select count(*) from filtered),'clients',(select count(*) from coach_clients where coach_id=identity.actor_id() and state='active'),
 'plans',(select count(*) from plans where coach_id=identity.actor_id())) into result;
 return result;
end $$;
create or replace function public.client_today() returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'relationships',coalesce((select jsonb_agg(c) from coach_clients c where client_id=identity.actor_id()),'[]'),
 'assignments',coalesce((select jsonb_agg(a) from assignments a join coach_clients c on c.id=a.relationship_id where a.client_id=identity.actor_id() and a.state='active' and c.state='active'),'[]'),
 'versions',coalesce((select jsonb_agg(v) from plan_versions v where id in(select a.version_id from assignments a join coach_clients c on c.id=a.relationship_id where a.client_id=identity.actor_id() and a.state='active' and c.state='active')),'[]'),
 'people',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name)) from profiles p where id in(select coach_id from coach_clients where client_id=identity.actor_id())),'[]'),
 'feedback',coalesce((select jsonb_agg(s) from (select id,coach_note,reviewed_at from sessions where client_id=identity.actor_id() and coach_note<>'' order by reviewed_at desc,id limit 1) s),'[]')) where identity.actor_id() is not null;
$$;
create or replace function public.coach_roster(p_search text default '',p_state text default 'active',p_after_name text default null,p_after_id uuid default null,p_limit int default 12)
returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if identity.actor_id() is null then raise exception 'forbidden'; end if;
 if p_state not in('active','archived') or length(p_search)>100 or p_limit not between 1 and 50 or p_limit is null then raise exception 'invalid_filter'; end if;
 with found as (
 select c.*,p.display_name from coach_clients c join profiles p on p.id=c.client_id
 where c.coach_id=identity.actor_id() and c.state=p_state and strpos(lower(p.display_name),lower(trim(p_search)))>0
 ), page as (select * from found where p_after_name is null or (lower(display_name),id)>(p_after_name,p_after_id) order by lower(display_name),id limit p_limit)
 select jsonb_build_object('total',(select count(*) from found),'items',coalesce((select jsonb_agg(to_jsonb(page) order by lower(display_name),id) from page),'[]'),
 'assignments',coalesce((select jsonb_agg(a) from assignments a where a.state='active' and a.relationship_id in(select id from page)),'[]')) into result;
 return result;
end $$;
revoke all on function public.coach_attention(text,timestamptz,text,int,text),public.client_today(),public.coach_roster(text,text,text,uuid,int) from public,rafik_guest;
grant execute on function public.coach_attention(text,timestamptz,text,int,text),public.client_today(),public.coach_roster(text,text,text,uuid,int) to rafik_user;

