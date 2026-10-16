-- Defining-side keys include the exact tenant/member fields used by Prisma relations.
alter table public.organization_session_feedback
 drop constraint organization_session_feedback_member_id_workout_id_key,
 drop constraint organization_session_feedback_member_id_event_id_key,
 add constraint organization_feedback_workout unique(workspace_id,member_id,workout_id),
 add constraint organization_feedback_event unique(workspace_id,member_id,event_id);
