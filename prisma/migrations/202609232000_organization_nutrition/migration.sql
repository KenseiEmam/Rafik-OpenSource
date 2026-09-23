-- Separate organization-owned guidance and explicitly shared diary. No independent relationship reuse.
create table public.organization_nutrition_sharing (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 member_id uuid primary key,
 enabled boolean not null default false,
 revision int not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) on delete cascade
);
create table public.organization_nutrition_plans (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 member_id uuid not null,
 author_id uuid not null,
 revision int not null check(revision>0),
 effective_on date not null,
 expires_on date,
 targets jsonb not null,
 meals jsonb not null default '[]',
 guidance text not null default '' check(char_length(guidance)<=4000),
 created_at timestamptz not null default now(),
 check(expires_on is null or expires_on>=effective_on),
 unique(workspace_id,member_id,revision),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) on delete cascade,
 foreign key(workspace_id,author_id) references public.workspace_members(workspace_id,id) on delete no action
);
create index on public.organization_nutrition_plans(workspace_id,member_id,effective_on desc,revision desc);
create table public.organization_meals (
 id uuid primary key,
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 member_id uuid not null,
 logged_on date not null,
 food jsonb not null,
 note text not null default '' check(char_length(note)<=2000),
 revision int not null default 1 check(revision>0),
 removed boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(workspace_id,member_id) references public.workspace_members(workspace_id,id) on delete cascade,
 unique(workspace_id,id)
);
create index on public.organization_meals(workspace_id,member_id,logged_on,created_at);
create table public.organization_meal_history (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null,
 meal_id uuid not null,
 revision int not null,
 document jsonb not null,
 recorded_at timestamptz not null default now(),
 unique(meal_id,revision),
 foreign key(workspace_id,meal_id) references public.organization_meals(workspace_id,id) on delete cascade
);
revoke all on public.organization_nutrition_sharing,public.organization_nutrition_plans,public.organization_meals,public.organization_meal_history from public,rafik_guest,rafik_user;
grant select,insert,update,delete on public.organization_nutrition_sharing,public.organization_nutrition_plans,public.organization_meals,public.organization_meal_history to rafik_api;
grant execute on function public.validate_nutrients(jsonb),public.validate_nutrition_meals(jsonb) to rafik_api;
