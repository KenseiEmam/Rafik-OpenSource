-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.handle_user_program_inductions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  existing_inductions json[];  -- Declare as JSON array
  new_chat_id BIGINT;
  new_form_id BIGINT;
  client_user_id BIGINT;
BEGIN
  -- 1) Get the inductions from the programs row (as json[])
  SELECT p.inductions 
    INTO existing_inductions
    FROM programs p
   WHERE p.id = NEW.program_id;

  -- If inductions is NULL or empty, then skip
  IF existing_inductions IS NULL OR array_length(existing_inductions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2) Get the actual user_id from the profiles table
  SELECT pr.user_id
    INTO client_user_id
    FROM profiles pr
   WHERE pr.id = NEW.client_id
   LIMIT 1;

  IF client_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 3) Create a new chat_message record for this user_program
  INSERT INTO chat_messages (user_program, sent_by)
       VALUES (NEW.id, NEW.trainer_id)
    RETURNING id INTO new_chat_id;

  -- 4) Create a new forms record referencing the new chat_message and using the inductions value
  INSERT INTO forms (message_id, program_id, questions, status, trainer_id, client_id, type)
       VALUES (
         new_chat_id,
         NEW.program_id,
         existing_inductions,  -- Note: this is a json[] value
         'pending',
         NEW.trainer_id,
         client_user_id,
         'induction'
       )
    RETURNING id INTO new_form_id;

  -- 5) Update the chat_message record with the forms id
  UPDATE chat_messages
     SET form = new_form_id
   WHERE id = new_chat_id;

  RETURN NEW;
END;
$function$
;
