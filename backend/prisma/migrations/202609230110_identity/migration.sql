create table identity.sessions (
 token_hash text primary key, user_id uuid not null references identity.users(id) on delete cascade,
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 last_seen_at timestamptz not null default now()
);
create index sessions_user on identity.sessions(user_id);
create table identity.challenges (
 email text primary key, code_hash text not null, expires_at timestamptz not null,
 sent_at timestamptz not null default now(), attempts integer not null default 0 check(attempts between 0 and 5)
);
create table identity.mail_messages (
 id uuid primary key default gen_random_uuid(), email text not null, subject text not null,
 body text not null, created_at timestamptz not null default now(), expires_at timestamptz not null
);
create table identity.rate_limits (
 key text primary key, count integer not null default 1, window_start timestamptz not null default now()
);
grant select,insert,update,delete on identity.sessions,identity.challenges,identity.mail_messages,identity.rate_limits to rafik_api;
