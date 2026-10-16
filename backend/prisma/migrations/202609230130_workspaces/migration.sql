-- One identity, fixed business contexts. Organization records outlive individual staff.
create table public.workspaces (
 id uuid primary key, kind text not null check(kind in ('independent','organization')),
 name text not null check(length(trim(name)) between 1 and 100),
 created_by uuid references identity.users(id) on delete set null,
 archived boolean not null default false, revision integer not null default 1,
 created_at timestamptz not null default now()
);
create table public.workspace_members (
 id uuid primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references identity.users(id) on delete cascade,
 roles text[] not null, active boolean not null default true, revision integer not null default 1,
 trainer_id uuid, joined_at timestamptz not null default now(),
 unique(workspace_id,user_id),unique(workspace_id,id),
 foreign key(workspace_id,trainer_id) references public.workspace_members(workspace_id,id),
 check(cardinality(roles) between 1 and 3 and roles <@ array['admin','trainer','trainee']::text[]),
 check(trainer_id is null or (trainer_id<>id and 'trainee'=any(roles)))
);
create index workspace_members_user on public.workspace_members(user_id,active);
create index workspace_members_trainer on public.workspace_members(workspace_id,trainer_id) where active;
create table public.workspace_invitations (
 id uuid primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade,
 email text not null, roles text[] not null, token_hash text not null unique,
 created_by uuid references identity.users(id) on delete set null,
 expires_at timestamptz not null default now()+interval '7 days',
 state text not null default 'pending' check(state in('pending','accepted','revoked')),
 accepted_by uuid references identity.users(id) on delete set null,
 created_at timestamptz not null default now(),
 check(cardinality(roles) between 1 and 3 and roles <@ array['admin','trainer','trainee']::text[])
);
create index workspace_invitations_pending on public.workspace_invitations(workspace_id,email) where state='pending';
create table public.workspace_events (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid references identity.users(id) on delete set null,
 kind text not null, subject_id uuid, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create index workspace_events_recent on public.workspace_events(workspace_id,created_at desc,id);
create table public.workspace_operations (
 id uuid primary key, workspace_id uuid not null references public.workspaces(id) on delete cascade,
 actor_id uuid not null references identity.users(id) on delete cascade,
 payload jsonb not null, result jsonb not null, created_at timestamptz not null default now()
);
create table public.platform_grants (
 user_id uuid primary key references identity.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
-- ORM tables are API-internal; they are never exposed through generic browser row/function routes.
revoke all on public.workspaces, public.workspace_members,public.workspace_invitations,public.workspace_events,public.workspace_operations,public.platform_grants from public,rafik_user,rafik_guest;
grant select,insert,update,delete on public.workspaces, public.workspace_members,public.workspace_invitations,public.workspace_events,public.workspace_operations to rafik_api;
grant select on public.platform_grants to rafik_api;
-- Existing verified coaches receive their explicit independent context. New people activate coaching deliberately.
insert into public.workspaces(id,kind,name,created_by)
select p.id,'independent',coalesce(nullif(p.display_name,''),'My coaching'),p.id from public.profiles p
where exists(select 1 from public.plans x where x.coach_id=p.id) or exists(select 1 from public.coach_clients c where c.coach_id=p.id);
insert into public.workspace_members(id,workspace_id,user_id,roles)
select gen_random_uuid(),id,created_by,array['trainer'] from public.workspaces where kind='independent';
