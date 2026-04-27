create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key,
  email text unique,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.energy_profiles (
  user_id text primary key references public.users(id) on delete cascade,
  default_energy text not null check (default_energy in ('low', 'medium', 'high')),
  focus_pattern jsonb not null default '{}'::jsonb,
  recovery_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  title text not null,
  urgency int not null check (urgency between 1 and 10),
  importance int not null check (importance between 1 and 10),
  energy_cost text not null check (energy_cost in ('low', 'medium', 'high')),
  estimated_minutes int not null default 30,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  mood int not null check (mood between 1 and 10),
  stress_level int not null check (stress_level between 1 and 10),
  sleep_quality int not null check (sleep_quality between 1 and 10),
  screen_fatigue int not null check (screen_fatigue between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.recovery_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  protocol_id text not null,
  duration_minutes int not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.energy_profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.checkins enable row level security;
alter table public.recovery_sessions enable row level security;

create policy "users manage own row" on public.users
  for all using ((auth.jwt() ->> 'sub') = id)
  with check ((auth.jwt() ->> 'sub') = id);

create policy "energy profiles manage own row" on public.energy_profiles
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "tasks manage own rows" on public.tasks
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "checkins manage own rows" on public.checkins
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

create policy "recovery sessions manage own rows" on public.recovery_sessions
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);
