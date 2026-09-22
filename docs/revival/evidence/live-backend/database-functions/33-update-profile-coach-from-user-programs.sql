-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_profile_coach_from_user_programs()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Update the profiles table based on the new client-trainer relationship
  update profiles
  set coach = NEW.trainer_id
  where id = NEW.client_id;

  return NEW;
end;
$function$
;
