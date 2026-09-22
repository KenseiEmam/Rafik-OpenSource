-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public."update Equipment Required"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    v_equipment_list TEXT[];
BEGIN
    -- Extract unique equipment from all exercises in the new workouts JSON array (avoiding "" due to backslash errors)
    SELECT ARRAY_AGG(DISTINCT REPLACE(eq::TEXT, '"', '')) INTO v_equipment_list
    FROM (
        SELECT (json_array_elements(e->'equipment'))::TEXT AS eq
        FROM unnest(NEW.workouts) AS w_json, 
             json_array_elements(w_json->'exercises') e
    ) subquery;

    -- Set the new value before update (to prevent recursion)
    NEW.equipment_required := v_equipment_list;

    RETURN NEW;
END;$function$
;
