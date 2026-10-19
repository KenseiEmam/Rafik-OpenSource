-- Coaching team: one primary coach plus supporting coaches scoped to a sport or specialty.
-- workspace_members.trainer_id remains a same-transaction mirror of the active primary link.
create table public.organization_coaching_links (
  id uuid primary key,
  workspace_id uuid not null,
  athlete_member_id uuid not null,
  coach_member_id uuid not null,
  kind text not null check(kind in ('primary','supporting')),
  sport_id uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  ended_by uuid,
  ended_at timestamptz,
  revision integer not null default 1,
  check(athlete_member_id <> coach_member_id),
  check((kind = 'primary') = (sport_id is null)),
  -- ended_by is null when a membership change ended the link (see trigger below).
  check(ended_by is null or ended_at is not null),
  unique(workspace_id,id),
  foreign key(workspace_id,athlete_member_id) references public.workspace_members(workspace_id,id) on delete cascade,
  foreign key(workspace_id,coach_member_id) references public.workspace_members(workspace_id,id) on delete cascade,
  foreign key(workspace_id,sport_id) references public.organization_sports(workspace_id,id)
);
create unique index organization_coaching_one_primary on public.organization_coaching_links(workspace_id,athlete_member_id) where kind = 'primary' and ended_at is null;
create unique index organization_coaching_one_active_pair on public.organization_coaching_links(workspace_id,athlete_member_id,coach_member_id) where ended_at is null;
create index organization_coaching_coach on public.organization_coaching_links(workspace_id,coach_member_id) where ended_at is null;
-- Preserve existing responsibility as active primary links.
insert into public.organization_coaching_links(id,workspace_id,athlete_member_id,coach_member_id,kind,created_by)
select gen_random_uuid(),m.workspace_id,m.id,m.trainer_id,'primary',m.trainer_id
from public.workspace_members m where m.trainer_id is not null;
-- The database keeps links consistent with workspace_members on every write path (API, seed and
-- the SQL account-deletion function): trainer_id drives the primary link, and deactivation or a
-- removed role ends links. The API creates/ends links first to record its acting member; the
-- trigger then finds nothing left to do. Links ended here have no ended_by.
create function public.sync_coaching_links() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if tg_op = 'UPDATE' then
    if old.active and not new.active then
      update public.organization_coaching_links set ended_at=now(),revision=revision+1
      where ended_at is null and workspace_id=new.workspace_id
        and (athlete_member_id=new.id or coach_member_id=new.id);
    end if;
    if 'trainee'=any(old.roles) and not 'trainee'=any(new.roles) then
      update public.organization_coaching_links set ended_at=now(),revision=revision+1
      where ended_at is null and workspace_id=new.workspace_id and athlete_member_id=new.id;
    end if;
    if 'trainer'=any(old.roles) and not 'trainer'=any(new.roles) then
      update public.organization_coaching_links set ended_at=now(),revision=revision+1
      where ended_at is null and workspace_id=new.workspace_id and coach_member_id=new.id;
    end if;
  end if;
  if tg_op = 'INSERT' or new.trainer_id is distinct from old.trainer_id then
    update public.organization_coaching_links set ended_at=now(),revision=revision+1
    where ended_at is null and workspace_id=new.workspace_id and athlete_member_id=new.id
      and kind='primary' and coach_member_id is distinct from new.trainer_id;
    if new.trainer_id is not null and not exists(
      select 1 from public.organization_coaching_links
      where ended_at is null and workspace_id=new.workspace_id and athlete_member_id=new.id
        and coach_member_id=new.trainer_id and kind='primary'
    ) then
      update public.organization_coaching_links set ended_at=now(),revision=revision+1
      where ended_at is null and workspace_id=new.workspace_id and athlete_member_id=new.id
        and coach_member_id=new.trainer_id;
      insert into public.organization_coaching_links(id,workspace_id,athlete_member_id,coach_member_id,kind,created_by)
      values(gen_random_uuid(),new.workspace_id,new.id,new.trainer_id,'primary',new.trainer_id);
    end if;
  end if;
  return new;
end $$;
create trigger workspace_members_sync_coaching_links after insert or update of active,roles,trainer_id on public.workspace_members
for each row execute function public.sync_coaching_links();
revoke all on function public.sync_coaching_links() from public;
revoke all on public.organization_coaching_links from public,rafik_guest,rafik_user;
grant select,insert,update on public.organization_coaching_links to rafik_api;
