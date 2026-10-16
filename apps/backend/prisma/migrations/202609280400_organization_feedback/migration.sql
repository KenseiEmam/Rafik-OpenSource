-- Explicit optional ratings. No neutral default; source and author remain distinguishable.
alter table public.organization_sessions add constraint organization_session_subject unique(workspace_id,member_id,id);
alter table public.organization_event_people add constraint organization_event_subject unique(workspace_id,member_id,event_id);
create table public.organization_session_feedback (
 id uuid primary key,workspace_id uuid not null,member_id uuid not null,
 workout_id uuid,event_id uuid,score integer not null check(score between 1 and 5),
 revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(num_nonnulls(workout_id,event_id)=1),unique(member_id,workout_id),unique(member_id,event_id),
 foreign key(workspace_id,member_id,workout_id) references public.organization_sessions(workspace_id,member_id,id) on delete cascade,
 foreign key(workspace_id,member_id,event_id) references public.organization_event_people(workspace_id,member_id,event_id) on delete cascade
);
create table public.organization_workplace_feedback (
 workspace_id uuid not null,member_id uuid not null,month date not null check(extract(day from month)=1),
 score integer not null check(score between 1 and 5),revision integer not null default 1,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 primary key(workspace_id,member_id,month),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) on delete cascade
);
create index organization_feedback_period on public.organization_session_feedback(workspace_id,created_at);
revoke all on public.organization_session_feedback,public.organization_workplace_feedback from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_session_feedback,public.organization_workplace_feedback to rafik_api;
