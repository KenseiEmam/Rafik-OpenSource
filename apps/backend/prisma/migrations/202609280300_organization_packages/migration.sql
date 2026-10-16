create table public.organization_packages (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 member_id uuid not null,
 created_by uuid not null,
 renewed_from uuid unique,
 title text not null check(length(title) between 1 and 160),
 allowance integer not null check(allowance between 1 and 1000),
 starts_on date not null,
 ends_on date not null,
 timezone text not null,
 archived boolean not null default false,
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(ends_on>=starts_on),
 unique(workspace_id,member_id,id),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) deferrable initially deferred,
 foreign key(workspace_id,member_id,renewed_from) references public.organization_packages(workspace_id,member_id,id) deferrable initially deferred,
 foreign key(workspace_id,created_by) references public.workspace_members(workspace_id,id) deferrable initially deferred
);
create index organization_packages_member on public.organization_packages(workspace_id,member_id,ends_on,id);
alter table public.organization_event_people
 add column package_id uuid,
 add column makeup_for uuid,
 add constraint organization_event_makeup foreign key(makeup_for,member_id) references public.organization_event_people(event_id,member_id) deferrable initially deferred,
 add constraint organization_event_makeup_not_self check(makeup_for is null or makeup_for<>event_id),
 add column independent_reason text not null default 'other' check(independent_reason in('trial','makeup','prize','other','')),
 add column charge_absence boolean,
 add column session_note text not null default '' check(length(session_note)<=2000),
 add column checked_in_at timestamptz,
 add constraint organization_event_package_member foreign key(workspace_id,member_id,package_id) references public.organization_packages(workspace_id,member_id,id) deferrable initially deferred,
 add constraint organization_event_funding check(package_id is null or (duty='trainee' and independent_reason=''));
create index organization_event_package on public.organization_event_people(package_id) where package_id is not null;
revoke all on public.organization_packages from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_packages to rafik_api;
create view public.organization_package_balances as
 select p.*,
 count(ep.event_id) filter(where e.state='scheduled')::integer as reserved,
 count(ep.event_id) filter(where e.state='completed' and (ep.attendance='present' or (ep.attendance='absent' and ep.charge_absence=true)))::integer as used,
 p.allowance-count(ep.event_id) filter(where e.state='scheduled' or (e.state='completed' and (ep.attendance='present' or (ep.attendance='absent' and ep.charge_absence=true))))::integer as available
 from public.organization_packages p
 left join public.organization_event_people ep on ep.package_id=p.id
 left join public.organization_events e on e.id=ep.event_id
 group by p.id;
revoke all on public.organization_package_balances from public,rafik_guest,rafik_user;
grant select on public.organization_package_balances to rafik_api;
