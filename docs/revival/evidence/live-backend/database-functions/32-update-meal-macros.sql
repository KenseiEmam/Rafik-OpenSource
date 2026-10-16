-- Captured definition for audit reference; not a migration.
CREATE OR REPLACE FUNCTION public.update_meal_macros()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
    meal_names TEXT[] := ARRAY['breakfast', 'lunch', 'dinner', 'supper'];
    food_item json;
    meal_macros FLOAT[];
    overall_macros FLOAT[] := ARRAY[0, 0, 0, 0];
    rounded_meal_macros FLOAT[];
    rounded_overall_macros FLOAT[];
    i INTEGER;
    meal_literal TEXT;
    overall_literal TEXT;
BEGIN
    -- Loop over each meal (breakfast, lunch, dinner, supper)
    FOR i IN 1 .. array_length(meal_names, 1) LOOP
        -- Reset meal macros for current meal: [protein, carbs, fats, calories]
        meal_macros := ARRAY[0, 0, 0, 0];

        IF meal_names[i] = 'breakfast' THEN
            IF NEW.breakfast IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.breakfast LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
                    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
                    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
                    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            -- Round to 3 decimals
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.breakfast_macros := meal_literal;
        
        ELSIF meal_names[i] = 'lunch' THEN
            IF NEW.lunch IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.lunch LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.lunch_macros := meal_literal;
        
        ELSIF meal_names[i] = 'dinner' THEN
            IF NEW.dinner IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.dinner LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.dinner_macros := meal_literal;
        
        ELSIF meal_names[i] = 'supper' THEN
            IF NEW.supper IS NOT NULL THEN
                FOREACH food_item IN ARRAY NEW.supper LOOP
                     meal_macros[1] := meal_macros[1] + ((food_item->>'protein')::double precision);
    meal_macros[2] := meal_macros[2] + ((food_item->>'carbohydrates')::double precision);
    meal_macros[3] := meal_macros[3] + ((food_item->>'fats')::double precision);
    meal_macros[4] := meal_macros[4] + ((food_item->>'calories')::double precision);
                END LOOP;
            END IF;
            rounded_meal_macros := ARRAY[
                round(meal_macros[1]::numeric, 3)::FLOAT,
                round(meal_macros[2]::numeric, 3)::FLOAT,
                round(meal_macros[3]::numeric, 3)::FLOAT,
                round(meal_macros[4]::numeric, 3)::FLOAT
            ];
            meal_literal := '{' || array_to_string(rounded_meal_macros, ',') || '}';
            NEW.supper_macros := meal_literal;
        END IF;

        -- Add the (non-rounded) meal totals into overall macros
        overall_macros[1] := overall_macros[1] + meal_macros[1];
        overall_macros[2] := overall_macros[2] + meal_macros[2];
        overall_macros[3] := overall_macros[3] + meal_macros[3];
        overall_macros[4] := overall_macros[4] + meal_macros[4];
    END LOOP;

    -- Round overall macros to 3 decimals and convert to proper array literal
    rounded_overall_macros := ARRAY[
        round(overall_macros[1]::numeric, 3)::FLOAT,
        round(overall_macros[2]::numeric, 3)::FLOAT,
        round(overall_macros[3]::numeric, 3)::FLOAT,
        round(overall_macros[4]::numeric, 3)::FLOAT
    ];
    overall_literal := '{' || array_to_string(rounded_overall_macros, ',') || '}';
    NEW.overall_macros := overall_literal;

    RETURN NEW;
END;$function$
;
