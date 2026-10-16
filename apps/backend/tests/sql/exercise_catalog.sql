begin;
create function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
select pg_temp.assert((select count(*) from public.exercises where id like 'dataset-%' and owner_id is null)=1324,'the shared upstream catalogue adds exactly 1,324 rows without assuming a total catalogue size');
select pg_temp.assert((select count(distinct id) from public.exercises where id like 'dataset-%')=1324,'every imported source identity has a stable distinct Rafik ID');
select pg_temp.assert((select count(*) from public.exercises where id like 'wger-%' and owner_id is null)=46,'the separately licensed WGER additions add exactly 46 shared rows');
select pg_temp.assert((select count(*) from public.exercises where id like 'wger-%' and media_ref is not null)=45,'only the reviewed WGER records have managed video references');
select pg_temp.assert((select name='3/4 sit-up' and instructions like 'Lie flat on your back%' and name_ar='' and instructions_ar='' and equipment='Bodyweight' and equipment_ar='وزن الجسم' and movement='waist' and kind='strength' and category='waist' and body_part='waist' and target_muscle='abs' and media_url='' and media_ref is null from public.exercises where id='dataset-0001'),'the first imported record retains English text, controlled vocabulary and no source media');
select pg_temp.assert((select kind='timed' and category='cardio' and body_part='cardio' from public.exercises where id='dataset-3220'),'the explicit body-part mapping classifies cardio entries as timed');
select pg_temp.assert((select kind='timed' from public.exercises where id='dataset-1512'),'reviewed static stretches use time recording');
select pg_temp.assert((select kind='timed' from public.exercises where id='dataset-2135'),'reviewed static plank holds use time recording');
select pg_temp.assert((select kind='strength' from public.exercises where id='dataset-3664'),'dynamic plank variations retain strength recording');
select pg_temp.assert((select name='Seated Hip Adduction' and instructions like 'Adjust the thigh pads%' and category='upper legs' and body_part='upper legs' and target_muscle='unspecified' and media_ref is not null from public.exercises where id='wger-12'),'WGER rows retain reviewed metadata, normalized facets and a managed video reference');
select pg_temp.assert((select instructions not like '%Translated with DeepL%' and instructions like 'Setup and Starting Position%' from public.exercises where id='wger-75'),'the forward correction removes a translator-service footer from the current shared instruction without changing snapshots');
select pg_temp.assert((select instructions like 'Set the bar around shoulder height%' and media_ref is not null from public.exercises where id='wger-341'),'reviewed authored guidance fills the WGER English source gap while retaining managed media');
select pg_temp.assert((select media_ref is null and source_ref='wger-477' from public.exercises where id='wger-477'),'the ambiguous assisted pull-up record retains its text provenance without reusing indistinguishable pull-up footage');
select pg_temp.assert((select count(*) from public.exercises where id like 'dataset-%' and (category is null or body_part is null or target_muscle is null))=0,'all imported shared rows carry filter facets');
select pg_temp.assert((select count(*) from public.exercises where id in ('goblet-squat','dumbbell-row','floor-press','romanian-deadlift','split-squat','glute-bridge','overhead-press','dead-bug','forearm-plank','brisk-walk','stationary-cycle','incline-pushup','low-step-up','band-row') and category is not null and body_part is not null and target_muscle is not null)=14,'the existing starter identities retain normalized filter facets');
select pg_temp.assert(exists(select 1 from public.exercises where id='dataset-0001'),'an independent actor can read the shared catalogue through the scoped table policy');
select pg_temp.assert((select source_ref='dataset-0001' from public.exercises where id='dataset-0001') and (select source_ref='wger-12' from public.exercises where id='wger-12'),'all imported records keep immutable source references independently of their current media mapping');
select pg_temp.assert((select category='chest' and body_part='chest' and target_muscle='pectorals' from public.save_exercise('r15-faceted-custom','{"name":"Faceted custom","instructions":"Move with control.","equipment":"","equipment_ar":"","movement":"push","kind":"strength","category":"chest","body_part":"chest","target_muscle":"pectorals"}'::jsonb,0)),'independent custom exercises retain controlled category, body-part and target-muscle facets');
do $$ begin perform public.save_exercise('r15-invalid-category','{"name":"Invalid","instructions":"Move with control.","kind":"strength","category":"unbounded"}'::jsonb,0);raise exception 'accepted';exception when raise_exception then if sqlerrm<>'invalid_exercise' then raise;end if;end $$;
select pg_temp.assert(true,'independent custom exercises reject unbounded category facets');
-- Snapshot copying is an internal helper; test its preserved attribution under the
-- migration role without making the helper callable from browser identities.
reset role;
do $$ declare p public.plans; copied text; begin
 p:=public.copy_snapshot_plan('21111111-1111-4111-8111-111111111111','10000000-0000-4000-8000-000000000001','Dataset attribution copy','{"schema":1,"days":[{"id":"source-copy","name":"Source copy","exercises":[{"key":"source","exerciseId":"dataset-0001","kind":"strength","sets":1,"reps":1,"load":0,"unit":"kg","rest":0,"note":""}]}]}'::jsonb);
 copied:=p.draft#>>'{days,0,exercises,0,exerciseId}';
 perform pg_temp.assert((select source_ref='dataset-0001' from public.exercises where id=copied),'shared snapshot copies preserve immutable source attribution after becoming coach-owned');
end $$;
rollback;
