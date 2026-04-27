create table if not exists public.users (
  id text primary key,
  email text unique,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "users manage own row" on public.users;

create policy "users manage own row"
on public.users
for all
using ((auth.jwt() ->> 'sub') = id)
with check ((auth.jwt() ->> 'sub') = id);

drop policy if exists "dashboard states manage own row" on public.dashboard_states;
drop table if exists public.dashboard_states;

create table public.dashboard_states (
  user_id text primary key references public.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dashboard_states enable row level security;

create policy "dashboard states manage own row"
on public.dashboard_states
for all
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);
