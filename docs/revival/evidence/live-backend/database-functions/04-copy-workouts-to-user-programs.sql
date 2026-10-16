-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.copy_workouts_to_user_programs()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin
  -- Fetch program details from the programs table using the new program_id
  -- and assign trainer_id and workouts to the new row
  select trainer_id, workouts
  into new.trainer_id, new.workouts
  from programs
  where id = new.program_id;

  -- Return the new row with updated values
  return new;
end;$function$
;
