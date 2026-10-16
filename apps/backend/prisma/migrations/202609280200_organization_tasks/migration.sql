create table public.organization_tasks (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 assigned_to uuid not null,
 created_by uuid not null,
 title text not null check(length(title) between 1 and 160),
 description text not null default '' check(length(description)<=2000),
 priority text not null default 'normal' check(priority in('normal','high')),
 due_date date,
 state text not null default 'open' check(state in('open','completed','cancelled')),
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 completed_at timestamptz,
 foreign key(workspace_id,assigned_to) references public.workspace_members(workspace_id,id) deferrable initially deferred,
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id) deferrable initially deferred,
 check((state='completed')=(completed_at is not null))
);
create index organization_tasks_queue on public.organization_tasks(workspace_id,assigned_to,state,due_date,id);
revoke all on public.organization_tasks from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_tasks to rafik_api;
