-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_drills_from_template()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Only run if the assessment_template is set
  if NEW.template is not null then
    update assessment
    set drills = (
      select drills
      from assessment_template
      where id = NEW.template
    )
    where id = NEW.id;
  end if;

  return NEW;
end;
$function$
;
