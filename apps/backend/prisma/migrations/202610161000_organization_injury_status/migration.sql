-- First-release injury tracking is limited to structured, athlete-reported
-- participation status. It stores no diagnosis, narrative or attachment.
create table public.organization_injury_permissions (
 workspace_id uuid not null,
 athlete_member_id uuid not null,
 age_group text not null check(age_group in ('adult','minor')),
 guardian_authorized boolean not null default false,
 guardian_verified_by uuid,
 guardian_verified_at timestamptz,
 athlete_assented_at timestamptz,
 assent_policy_version text,
 withdrawn_at timestamptz,
 revision integer not null default 1 check(revision > 0),
 configured_at timestamptz not null default now(),
 configured_by uuid not null,
 primary key(workspace_id,athlete_member_id),
 foreign key(workspace_id,athlete_member_id) references public.workspace_members(workspace_id,id) on delete cascade,
 check((age_group='minor' and guardian_authorized and guardian_verified_by is not null and guardian_verified_at is not null) or (age_group='adult' and not guardian_authorized and guardian_verified_by is null and guardian_verified_at is null))
);

create table public.organization_injury_records (
 id uuid primary key,
 workspace_id uuid not null,
 athlete_member_id uuid not null,
 participation text not null check(participation in ('modified','unavailable')),
 effective_from date not null,
 state text not null default 'active' check(state in ('active','closed')),
 revision integer not null default 1 check(revision > 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 closed_at timestamptz,
 unique(workspace_id,id),
 foreign key(workspace_id,athlete_member_id) references public.workspace_members(workspace_id,id) on delete cascade,
 check((state='closed')=(closed_at is not null))
);
create unique index organization_injury_one_active on public.organization_injury_records(workspace_id,athlete_member_id) where state='active';
create index organization_injury_athlete_history on public.organization_injury_records(workspace_id,athlete_member_id,created_at desc,id);
create index organization_injury_expiry on public.organization_injury_records(closed_at,id) where state='closed';

create table public.organization_injury_history (
 id uuid primary key,
 workspace_id uuid not null,
 record_id uuid not null,
 revision integer not null check(revision > 0),
 action text not null check(action in ('reported','corrected','closed','withdrawn')),
 participation text not null check(participation in ('modified','unavailable')),
 effective_from date not null,
 recorded_by uuid,
 recorded_at timestamptz not null default now(),
 unique(record_id,revision),
 foreign key(workspace_id,record_id) references public.organization_injury_records(workspace_id,id) on delete cascade
);

-- This log contains actor, subject, action and time only, never status values.
-- It cascades with the record at the fixed 12-month post-closure expiry.
create table public.organization_injury_access_log (
 id uuid primary key,
 workspace_id uuid not null,
 record_id uuid not null,
 athlete_member_id uuid not null,
 actor_id uuid not null,
 action text not null check(action in ('athlete_detail_read','coach_status_read','created','corrected','closed','consent_changed','consent_withdrawn')),
 created_at timestamptz not null default now(),
 foreign key(workspace_id,record_id) references public.organization_injury_records(workspace_id,id) on delete cascade,
 foreign key(workspace_id,athlete_member_id) references public.workspace_members(workspace_id,id) on delete cascade
);
create index organization_injury_access_recent on public.organization_injury_access_log(workspace_id,athlete_member_id,created_at desc);

-- Idempotency receipts contain only a request digest and acknowledgement IDs.
create table public.organization_injury_operations (
 workspace_id uuid not null,
 operation_id uuid not null,
 actor_id uuid not null,
 request_hash text not null check(length(request_hash)=64),
 record_id uuid not null,
 result_revision integer not null,
 created_at timestamptz not null default now(),
 primary key(workspace_id,operation_id),
 foreign key(workspace_id,record_id) references public.organization_injury_records(workspace_id,id) on delete cascade
);

revoke all on public.organization_injury_permissions,public.organization_injury_records,public.organization_injury_history,public.organization_injury_access_log,public.organization_injury_operations from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_injury_permissions,public.organization_injury_records to rafik_api;
grant select,insert on public.organization_injury_history,public.organization_injury_access_log,public.organization_injury_operations to rafik_api;
