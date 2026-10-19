-- Concurrent goal-specific plans: an athlete may hold several active assignments.
-- Existing assignments keep their state; immutable program versions are untouched.
drop index public.organization_one_active_assignment;
alter table public.organization_assignments
  add column goal text check(goal is null or (char_length(goal) between 1 and 80 and goal = btrim(goal))),
  add column sport_id uuid,
  add constraint organization_assignments_sport foreign key(workspace_id,sport_id) references public.organization_sports(workspace_id,id);
-- The same published version cannot be active twice for one athlete.
create unique index organization_one_active_version on public.organization_assignments(workspace_id,member_id,version_id) where state = 'active';
create index organization_assignments_active_member on public.organization_assignments(workspace_id,member_id) where state = 'active';
