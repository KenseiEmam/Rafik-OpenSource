-- Organization services use owned membership references, never independent relationships.
create table public.organization_groups (
 id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 100), created_by uuid not null,
 archived boolean not null default false, revision int not null default 1, unique(workspace_id,id),
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create table public.organization_group_members (
 workspace_id uuid not null references public.workspaces(id) on delete cascade, group_id uuid not null, member_id uuid not null,
 primary key(group_id,member_id), foreign key(workspace_id,group_id) references public.organization_groups(workspace_id,id) on delete cascade,
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create table public.assessment_templates (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
 created_by uuid not null,title text not null check(char_length(title) between 1 and 100),definition jsonb not null,
 revision int not null default 1,archived boolean not null default false,unique(workspace_id,id),
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create table public.organization_events (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
 created_by uuid not null,series_id uuid not null,title text not null check(char_length(title) between 1 and 100),
 starts_at timestamptz not null,ends_at timestamptz not null,timezone text not null,location text not null default '',
 kind text not null check(kind in('training','assessment')),definition jsonb,template_id uuid,template_revision int,
 state text not null default 'scheduled' check(state in('scheduled','cancelled','completed')),
 revision int not null default 1,created_at timestamptz not null default now(),unique(workspace_id,id),
 check(ends_at>starts_at and ends_at<=starts_at+interval '8 hours'),
 check((kind='assessment')=(definition is not null)),
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id) deferrable initially deferred,
 foreign key(workspace_id,template_id) references public.assessment_templates(workspace_id,id) deferrable initially deferred
);
create index organization_event_agenda on public.organization_events(workspace_id,starts_at,id);
create index organization_event_series on public.organization_events(workspace_id,series_id,starts_at);
create table public.organization_event_people (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,event_id uuid not null,member_id uuid not null,
 duty text not null check(duty in('staff','trainee')),attendance text not null default 'unmarked' check(attendance in('unmarked','present','absent','excused')),
 revision int not null default 1,primary key(event_id,member_id),
 foreign key(workspace_id,event_id) references public.organization_events(workspace_id,id) on delete cascade,
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create index organization_person_agenda on public.organization_event_people(workspace_id,member_id,event_id);
create table public.assessment_results (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,event_id uuid not null,member_id uuid not null,
 values jsonb not null,note text not null default '',revision int not null default 1,recorded_by uuid not null,recorded_at timestamptz not null default now(),
 primary key(event_id,member_id),
 foreign key(event_id,member_id) references public.organization_event_people(event_id,member_id) on delete cascade,
 foreign key(workspace_id,event_id) references public.organization_events(workspace_id,id) on delete cascade,
 foreign key(workspace_id,recorded_by) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create table public.assessment_result_history (
 id uuid primary key default gen_random_uuid(),workspace_id uuid not null references public.workspaces(id) on delete cascade,
 event_id uuid not null,member_id uuid not null,revision int not null,document jsonb not null,recorded_by uuid not null,recorded_at timestamptz not null default now(),
 unique(event_id,member_id,revision),
 foreign key(event_id,member_id) references public.assessment_results(event_id,member_id) on delete cascade,
 foreign key(workspace_id,recorded_by) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
-- Only explicit authorized server operations can read or mutate organizational service rows.
revoke all on public.organization_groups,public.organization_group_members,public.assessment_templates,public.organization_events,public.organization_event_people,public.assessment_results,public.assessment_result_history from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_groups,public.organization_group_members,public.assessment_templates,public.organization_events,public.organization_event_people,public.assessment_results,public.assessment_result_history to rafik_api;
-- Shared profile locks serialize organization/independent scheduling. This trigger validates the cross-context side of independent booking/rescheduling.
create function public.guard_organization_booking_conflict() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare ids uuid[];begin
 if new.state='booked' then
 select array[c.coach_id,c.client_id] into ids from public.coach_clients c where c.id=new.relationship_id;
 perform id from public.profiles where id=any(ids) order by id for update;
 if exists(select 1 from public.organization_events e join public.organization_event_people p on p.event_id=e.id join public.workspace_members m on m.id=p.member_id where e.state='scheduled' and m.user_id=any(ids) and tstzrange(e.starts_at,e.ends_at,'[)')&&tstzrange(new.starts_at,new.ends_at,'[)')) then raise exception 'time_unavailable';end if;
 end if;return new;
end $$;
create trigger appointment_organization_conflict before insert or update of starts_at,ends_at,state on public.appointments for each row execute function public.guard_organization_booking_conflict();
revoke all on function public.guard_organization_booking_conflict() from public,rafik_guest,rafik_user;
create function public.validate_calendar_collision(p_users uuid[],p_start timestamptz,p_end timestamptz,p_event uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 perform id from public.profiles where id=any(p_users) order by id for update;
 if exists(select 1 from public.organization_events e join public.organization_event_people p on p.event_id=e.id join public.workspace_members m on m.id=p.member_id where e.state='scheduled' and e.id is distinct from p_event and m.user_id=any(p_users) and tstzrange(e.starts_at,e.ends_at,'[)')&&tstzrange(p_start,p_end,'[)'))
 or exists(select 1 from public.appointments a join public.coach_clients c on c.id=a.relationship_id where a.state='booked' and (c.coach_id=any(p_users) or c.client_id=any(p_users)) and tstzrange(a.starts_at,a.ends_at,'[)')&&tstzrange(p_start,p_end,'[)')) then raise exception 'time_unavailable';end if;
end $$;
revoke all on function public.validate_calendar_collision(uuid[],timestamptz,timestamptz,uuid) from public,rafik_guest,rafik_user;
grant execute on function public.validate_calendar_collision(uuid[],timestamptz,timestamptz,uuid) to rafik_api;
