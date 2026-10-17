-- Keep an attributable record that an athlete exported their own status file.
alter table public.organization_injury_access_log
 drop constraint organization_injury_access_log_action_check;

alter table public.organization_injury_access_log
 add constraint organization_injury_access_log_action_check
 check(action in (
   'athlete_detail_read',
   'athlete_export',
   'coach_status_read',
   'reported',
   'corrected',
   'closed',
   'withdrawn',
   'consent_changed',
   'consent_withdrawn'
 ));
