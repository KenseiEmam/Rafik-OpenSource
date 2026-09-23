begin;
create or replace function pg_temp.assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
do $$ declare uid uuid;begin
 for i in 1..27 loop
  uid:=gen_random_uuid();insert into identity.users(id) values(uid);
  insert into public.profiles(id,display_name) values(uid,'Workspace fixture '||lpad(i::text,2,'0'));
  insert into public.coach_clients(id,coach_id,client_id) values(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',uid);
 end loop;
end $$;
set local role rafik_user;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"rafik_user"}',true);
do $$ declare first jsonb;second jsonb;last jsonb;begin
 first:=public.coach_roster('Workspace fixture','active',null,null,12);
 perform pg_temp.assert(jsonb_array_length(first->'items')=12 and (first->>'total')::int=27,'roster bounds payload with accurate total');
 last:=first->'items'->11;
 second:=public.coach_roster('Workspace fixture','active',lower(last->>'display_name'),(last->>'id')::uuid,12);
 perform pg_temp.assert(jsonb_array_length(second->'items')=12 and second#>>'{items,0,display_name}'='Workspace fixture 13','stable roster cursor has no repeated or skipped rows');
 perform pg_temp.assert((public.coach_roster('fixture 27')->>'total')::int=1,'search includes records beyond first page');
 perform pg_temp.assert((public.coach_roster('%')->>'total')::int=0,'search treats wildcard characters literally');
 begin perform public.coach_roster('', 'active',null,null,500);raise exception 'accepted';exception when raise_exception then if sqlerrm<>'invalid_filter' then raise;end if;end;
 perform pg_temp.assert(true,'oversized roster request rejected');
 first:=public.coach_attention('all',null,'',2);
 perform pg_temp.assert(jsonb_array_length(first->'items')<=2,'attention response is bounded');
 perform pg_temp.assert(not exists(select 1 from jsonb_array_elements(first->'items') x where coalesce(x->>'name','')=''),'attention rows identify their client');
end $$;
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"rafik_user"}',true);
select pg_temp.assert((public.coach_roster('Workspace fixture')->>'total')::int=0,'unrelated coach cannot read another roster projection');
select set_config('rafik.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"rafik_user"}',true);
select pg_temp.assert(jsonb_array_length(public.client_today()->'feedback')<=1,'client Today does not download entire feedback history');
select pg_temp.assert(not exists(select 1 from jsonb_array_elements(public.client_today()->'assignments') a where a->>'client_id'<>'10000000-0000-4000-8000-000000000002'),'client projection contains only own assignments');
rollback;
