-- Delegated workout logging: a coach may record a session for an athlete under the coach's own
-- identity. Every start, save and correction keeps an attributed history row.
alter table public.organization_sessions
  add column recorded_mode text not null default 'self' check(recorded_mode in ('self','delegated')),
  add column recorded_by uuid,
  -- Deferred like other member references so institution deletion can cascade in one statement.
  add constraint organization_sessions_recorded_by foreign key(workspace_id,recorded_by) references public.workspace_members(workspace_id,id) deferrable initially deferred,
  add constraint organization_sessions_delegated_by check(recorded_mode = 'self' or recorded_by is not null);
create table public.organization_session_history (
  id uuid primary key,
  workspace_id uuid not null,
  session_id uuid not null,
  version integer not null,
  actor_member_id uuid not null,
  action text not null check(action in ('start','save')),
  entries jsonb not null,
  note text not null,
  completed boolean not null,
  created_at timestamptz not null default now(),
  unique(session_id,version),
  foreign key(workspace_id,session_id) references public.organization_sessions(workspace_id,id) on delete cascade,
  foreign key(workspace_id,actor_member_id) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
revoke all on public.organization_session_history from public,rafik_guest,rafik_user;
grant select,insert on public.organization_session_history to rafik_api;
