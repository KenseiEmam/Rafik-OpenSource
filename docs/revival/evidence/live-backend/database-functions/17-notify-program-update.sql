-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.notify_program_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
    v_user_id bigint;   -- <-- bigint now
begin
    select p.user_id
      into v_user_id
      from public.profiles p
     where p.id = new.client_id;   -- bigint = bigint

    if v_user_id is null then
        raise warning 'No user_id found for client_id %', new.client_id;
        return new;
    end if;

    insert into public.notifications (user_id, title, body, created_at)
    values (
        v_user_id,
        'Your workout plan has been updated.',
        'Open the app to see your new exercises and schedule 💪',
        now()
    );

    return new;
end;
$function$
;
