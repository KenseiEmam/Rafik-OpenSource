-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.send_workout_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  -- looked-up fields
  v_trainer_email text;
  v_program_name  text;
  v_user_name     text;

  -- extracted from NEW.feel
  v_difficulty   int;
  v_pump         int;
  v_exhaustion   int;
  v_enjoyment    int;
  v_comments     text;

  -- secrets
  v_endpoint text;
  v_token    text;

  v_payload  jsonb;
begin
  -------------------------------------------------------------------
  -- Guard-clause: ignore if feel is empty / unchanged / not an object
  -------------------------------------------------------------------
  if coalesce(jsonb_typeof(NEW.feel::jsonb), '') <> 'object'
     or NEW.feel::jsonb = '{}'::jsonb
     or NEW.feel::jsonb is not distinct from OLD.feel::jsonb
  then
    return NEW;
  end if;

  -------------------------------------------------------------------
  -- Extract scalar ratings
  -------------------------------------------------------------------
  v_difficulty := (NEW.feel::jsonb ->> 'difficulty')::int;
  v_pump       := (NEW.feel::jsonb ->> 'pump')::int;
  v_exhaustion := (NEW.feel::jsonb ->> 'exhaustion')::int;
  v_enjoyment  := (NEW.feel::jsonb ->> 'enjoyment')::int;
  v_comments   :=  NEW.feel::jsonb ->> 'comments';

  -------------------------------------------------------------------
  -- Resolve trainer e-mail · program name · client first name
  -------------------------------------------------------------------
  select  u_trainer.email,
          prog.program_name,
          u_client.first_name
    into  v_trainer_email,
          v_program_name,
          v_user_name
  from workout_sheets ws
  join user_programs    up        on up.id         = ws.user_program_id
  join users            u_trainer on u_trainer.id  = up.trainer_id
  join programs         prog      on prog.id       = up.program_id
  join users            u_client  on u_client.id   = ws.client_id
  where ws.id = NEW.id;

  -------------------------------------------------------------------
  -- Pull secrets from Vault
  -------------------------------------------------------------------
  select decrypted_secret
    into v_token
    from vault.decrypted_secrets
   where name = 'workout_feedback_token';

  select decrypted_secret
    into v_endpoint
    from vault.decrypted_secrets
   where name = 'workout_feedback_endpoint';

  if v_endpoint is null then
      raise exception 'Vault secret "workout_feedback_endpoint" not found';
  end if;
  if v_token is null then
      raise exception 'Vault secret "workout_feedback_token" not found';
  end if;

  -------------------------------------------------------------------
  -- Build JSON payload
  -------------------------------------------------------------------
  v_payload := jsonb_build_object(
      'userName',      v_user_name,
      'trainerEmail',  v_trainer_email,
      'programName',   v_program_name,
      'difficulty',    v_difficulty,
      'pump',          v_pump,
      'exhaustion',    v_exhaustion,
      'enjoyment',     v_enjoyment,
      'comments',      v_comments
  );

  -------------------------------------------------------------------
  -- Fire Edge Function asynchronously
  -------------------------------------------------------------------
  perform net.http_post(
           url     := v_endpoint,
           body    := v_payload,
           headers := jsonb_build_object(
                         'Content-Type', 'application/json',
                         'Authorization', 'Bearer ' || v_token
                       )
         );

  return NEW;
end;
$function$
;
