-- Institution sports and general coaching specialties, separate from the single system role.
create table public.organization_sports (
  id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check(char_length(name) between 1 and 80 and name = btrim(name)),
  kind text not null check(kind in ('sport','specialty')),
  archived boolean not null default false,
  revision integer not null default 1,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique(workspace_id,id)
);
create unique index organization_sports_name on public.organization_sports(workspace_id,lower(name));
-- Athletes link to sports they take part in; coaches link to sports or specialties they cover.
create table public.organization_member_sports (
  workspace_id uuid not null,
  member_id uuid not null,
  sport_id uuid not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  primary key(member_id,sport_id),
  foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) on delete cascade,
  foreign key(workspace_id,sport_id) references public.organization_sports(workspace_id,id) on delete cascade
);
create index organization_member_sports_sport on public.organization_member_sports(workspace_id,sport_id);
revoke all on public.organization_sports,public.organization_member_sports from public,rafik_guest,rafik_user;
grant select,insert,update on public.organization_sports to rafik_api;
grant select,insert,delete on public.organization_member_sports to rafik_api;
