-- Remove gym-oriented session entitlements from the university product.
-- Calendar events, attendance, assessment history and makeup links remain.
drop view if exists public.organization_package_balances;
alter table public.organization_event_people
  drop constraint if exists organization_event_package_member,
  drop constraint if exists organization_event_funding,
  drop column if exists package_id,
  drop column if exists independent_reason,
  drop column if exists charge_absence;
drop table if exists public.organization_packages;
