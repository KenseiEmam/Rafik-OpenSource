-- Keep access/change events aligned with the lifecycle actions written by the API.
alter table public.organization_injury_access_log
 drop constraint organization_injury_access_log_action_check;

alter table public.organization_injury_access_log
 add constraint organization_injury_access_log_action_check
 check(action in (
   'athlete_detail_read',
   'coach_status_read',
   'reported',
   'corrected',
   'closed',
   'withdrawn',
   'consent_changed',
   'consent_withdrawn'
 ));
