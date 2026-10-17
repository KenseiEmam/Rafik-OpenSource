-- Publishing a program also makes it available in the institution program library.
-- Bring already-published, non-archived programs into line with that rule.
UPDATE public.organization_programs p
SET listed = true,
    revision = revision + 1,
    updated_at = now()
WHERE NOT p.listed
  AND EXISTS (
    SELECT 1
    FROM public.organization_versions v
    WHERE v.program_id = p.id
  );

-- Drafts may be incomplete, but their structure and metadata still have strict bounds.
CREATE OR REPLACE FUNCTION public.validate_program_draft(p jsonb) RETURNS void
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE d jsonb; day_ids text[]:=ARRAY[]::text[]; slots text[]:=ARRAY[]::text[]; slot text; training integer:=0; weeks integer;
BEGIN
  IF jsonb_typeof(p) IS DISTINCT FROM 'object'
     OR coalesce(p->>'schema','') NOT IN ('1','2') THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;
  IF jsonb_typeof(p->'days') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;
  IF jsonb_array_length(p->'days') NOT BETWEEN 1 AND 84 THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;
  weeks:=coalesce((p->>'cycleWeeks')::integer,1);
  IF weeks NOT BETWEEN 1 AND 12 THEN RAISE EXCEPTION 'invalid_day_count'; END IF;
  FOR d IN SELECT value FROM jsonb_array_elements(p->'days') LOOP
    IF jsonb_typeof(d) IS DISTINCT FROM 'object'
       OR nullif(d->>'id','') IS NULL OR d->>'id'=ANY(day_ids)
       OR length(coalesce(d->>'name','')) NOT BETWEEN 1 AND 80
       OR jsonb_typeof(d->'exercises') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'invalid_day';
    END IF;
    IF jsonb_array_length(d->'exercises')>12 THEN RAISE EXCEPTION 'invalid_day'; END IF;
    day_ids:=array_append(day_ids,d->>'id');
    IF p->>'schema'='2' THEN
      IF coalesce((d->>'week')::integer,0) NOT BETWEEN 1 AND weeks
         OR coalesce((d->>'weekday')::integer,-1) NOT BETWEEN 0 AND 6 THEN
        RAISE EXCEPTION 'invalid_schedule';
      END IF;
      slot:=(d->>'week')||':'||(d->>'weekday');
      IF slot=ANY(slots) THEN RAISE EXCEPTION 'invalid_duplicate_day'; END IF;
      slots:=array_append(slots,slot);
    END IF;
    IF coalesce((d->>'restDay')::boolean,false) THEN
      IF jsonb_array_length(d->'exercises')<>0 THEN RAISE EXCEPTION 'invalid_rest_day'; END IF;
    ELSE
      training:=training+1;
    END IF;
  END LOOP;
  IF training=0 THEN RAISE EXCEPTION 'invalid_empty_plan'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.validate_program_draft(jsonb) FROM public,rafik_guest,rafik_user;
GRANT EXECUTE ON FUNCTION public.validate_program_draft(jsonb) TO rafik_api;
