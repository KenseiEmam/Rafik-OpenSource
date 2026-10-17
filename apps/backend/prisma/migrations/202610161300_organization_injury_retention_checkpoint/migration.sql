-- A single aggregate checkpoint survives sensitive-record deletion without
-- retaining a person, organization, status value, or per-record identifier.
create table public.organization_injury_retention_checkpoint (
 singleton boolean primary key default true check(singleton),
 completed_at timestamptz not null,
 closed_count integer not null check(closed_count >= 0),
 purged_count integer not null check(purged_count >= 0)
);

revoke all on public.organization_injury_retention_checkpoint from public,rafik_guest,rafik_user;
grant select,insert,update on public.organization_injury_retention_checkpoint to rafik_api;
