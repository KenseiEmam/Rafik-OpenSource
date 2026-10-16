-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_average_ratings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  avg_trainer_rating numeric(10,2);
  avg_program_rating numeric(10,2);
  target_trainer_id numeric;  -- adjust datatype if needed
  target_program_id numeric;  -- adjust datatype if needed
BEGIN
  -- Determine the trainer and program IDs from the new or old row.
  target_trainer_id := COALESCE(NEW.trainer, OLD.trainer);
  target_program_id := COALESCE(NEW.program, OLD.program);

  -- Calculate the new average rating for the trainer.
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
    INTO avg_trainer_rating
    FROM reviews
    WHERE trainer = target_trainer_id;

  -- Update the trainer_profile table.
  UPDATE trainer_profile
    SET rating = avg_trainer_rating
    WHERE user_id = target_trainer_id;

  -- Calculate and update the program's overall rating, if applicable.
  IF target_program_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
      INTO avg_program_rating
      FROM reviews
      WHERE program = target_program_id;

    UPDATE programs
      SET overall_rating = avg_program_rating
      WHERE id = target_program_id;
  END IF;

  RETURN NULL;  -- AFTER triggers must return null
END;$function$
;
