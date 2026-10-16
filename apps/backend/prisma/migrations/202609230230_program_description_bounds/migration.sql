-- Keep the existing explicit prescription kind contract; alternatives still require matching kinds.
create or replace function public.validate_prescription_catalog(p jsonb, catalog jsonb) returns void
language plpgsql set search_path=public,pg_temp as $$
declare alt jsonb; alt_ids text[]; d jsonb; e jsonb; target jsonb; day_ids text[]:=array[]::text[]; slots text[]:=array[]::text[]; keys text[]; slot text; kind text; training int:=0;
begin
 if (p ? 'description' and (jsonb_typeof(p->'description')<>'string' or length(p->>'description')>1000)) or (p ? 'descriptionAr' and (jsonb_typeof(p->'descriptionAr')<>'string' or length(p->>'descriptionAr')>1000)) then raise exception 'invalid_program_details';end if;
 if jsonb_typeof(p) is distinct from 'object' or coalesce(p->>'schema','') not in('1','2') or jsonb_typeof(p->'days') is distinct from 'array' then raise exception 'invalid_plan'; end if;
 if jsonb_array_length(p->'days') not between 1 and 84 or coalesce((p->>'cycleWeeks')::int,1) not between 1 and 12 then raise exception 'invalid_day_count'; end if;
 for d in select value from jsonb_array_elements(p->'days') loop
  if nullif(d->>'id','') is null or d->>'id'=any(day_ids) or length(coalesce(d->>'name','')) not between 1 and 80
   or jsonb_typeof(d->'exercises') is distinct from 'array' then raise exception 'invalid_day'; end if;
  day_ids:=array_append(day_ids,d->>'id'); keys:=array[]::text[];
  if p->>'schema'='2' then
   if coalesce((d->>'week')::int,0) not between 1 and coalesce((p->>'cycleWeeks')::int,1) or coalesce((d->>'weekday')::int,-1) not between 0 and 6 then raise exception 'invalid_schedule'; end if;
   slot:=(d->>'week')||':'||(d->>'weekday');
   if slot=any(slots) then raise exception 'invalid_duplicate_day'; end if;
   slots:=array_append(slots,slot);
  end if;
  if coalesce((d->>'restDay')::boolean,false) then
   if jsonb_array_length(d->'exercises')<>0 then raise exception 'invalid_rest_day'; end if;
   continue;
  end if;
  training:=training+1;
  if jsonb_array_length(d->'exercises') not between 1 and 12 then raise exception 'invalid_exercise_count'; end if;
  for e in select value from jsonb_array_elements(d->'exercises') loop
   kind:=coalesce(e->>'kind','strength');
   if nullif(e->>'key','') is null or e->>'key'=any(keys)
    or not exists(select 1 from jsonb_array_elements(catalog) x where x->>'id'=e->>'exerciseId' and coalesce((x->>'active')::boolean,true))
    or coalesce((e->>'sets')::int,0) not between 1 and 10 or kind not in('strength','timed','distance')
    or coalesce((e->>'reps')::int,0) not between 1 and 100 or coalesce((e->>'load')::numeric,-1) not between 0 and 1000
    or coalesce(e->>'unit','') not in('kg','lb') or coalesce((e->>'rest')::int,-1) not between 0 and 600
    or length(coalesce(e->>'note',''))>500 or length(coalesce(e->>'group',''))>40 then raise exception 'invalid_exercise'; end if;
   if e ? 'targets' and (jsonb_typeof(e->'targets') is distinct from 'array' or jsonb_array_length(e->'targets')<>(e->>'sets')::int) then raise exception 'invalid_targets'; end if;
   for target in select value from jsonb_array_elements(coalesce(e->'targets',jsonb_build_array(e))) loop
    if coalesce((target->>'reps')::int,0) not between 1 and 100 or coalesce((target->>'load')::numeric,-1) not between 0 and 1000
      or (kind='timed' and coalesce((target->>'seconds')::int,0) not between 1 and 86400)
      or (kind='distance' and coalesce((target->>'metres')::numeric,0) not between 1 and 1000000)
      or (target->>'effort' is not null and (target->>'effort')::numeric not between 1 and 10) then raise exception 'invalid_target'; end if;
   end loop;
   if e ? 'alternatives' then
    if jsonb_typeof(e->'alternatives') is distinct from 'array' or jsonb_array_length(e->'alternatives')>3 then raise exception 'invalid_alternatives'; end if;
    alt_ids:=array[e->>'exerciseId'];
    for alt in select value from jsonb_array_elements(e->'alternatives') loop
     if jsonb_typeof(alt) is distinct from 'object' or nullif(alt->>'exerciseId','') is null or alt->>'exerciseId'=any(alt_ids)
      or not exists(select 1 from jsonb_array_elements(catalog) x where x->>'id'=alt->>'exerciseId' and coalesce((x->>'active')::boolean,true) and coalesce(x->>'kind','strength')=kind) then raise exception 'invalid_alternative'; end if;
     alt_ids:=array_append(alt_ids,alt->>'exerciseId');
    end loop;
   end if;
   keys:=array_append(keys,e->>'key');
  end loop;
 end loop;
 if training=0 then raise exception 'invalid_empty_plan'; end if;
end $$;

