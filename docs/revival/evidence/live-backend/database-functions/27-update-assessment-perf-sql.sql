-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_assessment_perf_sql()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  client_id        text;
  exercise_json    json;
  exercise_obj     jsonb;
  set_obj          jsonb;
  ex_id            text;
  weight_val       numeric;
  reps_val         numeric;
  orm              numeric;
  new_orms         jsonb := '[]'::jsonb;
  existing_profile jsonb;
  final_profile    jsonb := '[]'::jsonb;
  new_entry        jsonb;
  profile_obj      record;
  found            boolean;
  remove_index     int;
  current_best     numeric;
begin
  -- Assume first trainee is the client
  client_id := NEW.trainees[1]::text;

  -- Loop through each exercise in the json[] array
  foreach exercise_json in array NEW.drills
  loop
    exercise_obj := exercise_json::jsonb;
    ex_id := exercise_obj->>'id';

    -- Loop through true_sets
    for set_obj in select * from jsonb_array_elements(exercise_obj->'true_sets')
    loop
      weight_val := (set_obj->>'primary_done')::numeric;

      if (set_obj->>'control_abide')::boolean = true then
        reps_val := (exercise_obj->>'metric')::numeric;
      else
        reps_val := (set_obj->>'control_metric')::numeric;
      end if;

      if reps_val > 0 then
        orm := weight_val / (1 + 0.025 * reps_val);

        -- Check if there's already an ORM for this exercise
        select (entry->>'orm')::numeric
        into current_best
        from jsonb_array_elements(new_orms) entry
        where entry->>'exercise' = ex_id
        limit 1;

        -- If better or not present, replace
        if current_best is null or orm > current_best then
          select index into remove_index
          from jsonb_array_elements(new_orms) with ordinality e(elem, index)
          where e.elem->>'exercise' = ex_id
          limit 1;

          if remove_index is not null then
            new_orms := new_orms - remove_index;
          end if;

          new_orms := new_orms || jsonb_build_object('exercise', ex_id, 'orm', round(orm, 2));
        end if;
      end if;
    end loop;
  end loop;

  -- Update assessment ORM
  update assessment
  set overall_performance = new_orms
  where id = NEW.id;

  -- Get current best_perf from profile
  select test_perf
  into existing_profile
  from profiles
  where user_id = client_id::bigint;

  if existing_profile is null then
    existing_profile := '[]'::jsonb;
  end if;

  -- Merge new ORMs with profile
  for new_entry in select * from jsonb_array_elements(new_orms)
  loop
    found := false;

    for profile_obj in select jsonb_array_elements(existing_profile) as elem
    loop
      if profile_obj.elem->>'exercise' = new_entry->>'exercise' then
        found := true;
        if (new_entry->>'orm')::numeric > (profile_obj.elem->>'orm')::numeric then
          final_profile := final_profile || new_entry;
        else
          final_profile := final_profile || profile_obj.elem;
        end if;
        exit;
      end if;
    end loop;

    if not found then
      final_profile := final_profile || new_entry;
    end if;
  end loop;

  -- Update profile test_perf
  update profiles
  set test_perf = final_profile
  where user_id = client_id::bigint;

  return NEW;
end;
$function$
;
