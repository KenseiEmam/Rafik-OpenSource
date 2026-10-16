create table public.program_media (
 id uuid primary key, workspace_id uuid not null references public.workspaces on delete cascade,
 created_by uuid references identity.users on delete set null,
 media_type text not null check(media_type in('image/jpeg','image/png','image/webp')),
 bytes integer not null check(bytes between 1 and 2097152),digest text not null,
 created_at timestamptz not null default now()
);
revoke all on public.program_media from public,rafik_user,rafik_guest;
grant select,insert,delete on public.program_media to rafik_api;
alter table public.organization_programs add column revision integer not null default 1;
create function public.validate_program_presentation(p jsonb,p_workspace uuid) returns void language plpgsql set search_path=public,pg_temp as $$
declare v jsonb:=p->'presentation';begin
 if v is null then return;end if;
 if jsonb_typeof(v)<>'object' or length(coalesce(v->>'goal',''))>160 or coalesce(v->>'level','mixed') not in('beginner','mixed','experienced') or length(coalesce(p->>'description',''))>1000 or length(coalesce(p->>'descriptionAr',''))>1000 then raise exception 'invalid_program_details';end if;
 if nullif(v->>'cover','') is not null and not exists(select 1 from public.program_media where id=(v->>'cover')::uuid and workspace_id=p_workspace) then raise exception 'invalid_program_cover';end if;
end $$;
revoke all on function public.validate_program_presentation(jsonb,uuid) from public,rafik_user,rafik_guest;
grant execute on function public.validate_program_presentation(jsonb,uuid) to rafik_api;
create or replace function public.validate_prescription(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
begin
 perform public.validate_prescription_catalog(p,coalesce((select jsonb_agg(to_jsonb(x)) from public.exercises x where x.owner_id is null or x.owner_id=identity.actor_id()),'[]'));
 perform public.validate_program_presentation(p,(select w.id from public.workspaces w where w.kind='independent' and w.created_by=identity.actor_id() and not w.archived limit 1));
end $$;
