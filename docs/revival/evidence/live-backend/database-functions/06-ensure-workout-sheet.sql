-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.ensure_workout_sheet()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$begin
    -- Debugging: Print the values being inserted
    RAISE NOTICE 'Inserting workout for client_id: %, iteration: %', NEW.client_id, NEW.iteration;

    -- Check if the workout already exists
    if exists (
        select 1
        from workout_sheets
        where client_id = NEW.client_id
          and iteration = NEW.iteration
          and done = false
    ) then
        RAISE NOTICE 'Duplicate found for client_id: %, iteration: %', NEW.client_id, NEW.iteration;
        return null; -- Prevent duplicate insertion
    end if;

    -- If no duplicate, print a success notice for insertion
    RAISE NOTICE 'Inserting new workout for client_id: %, iteration: %', NEW.client_id, NEW.iteration;

    return NEW;
end;$function$
;
