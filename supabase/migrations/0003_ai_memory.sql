create extension if not exists pgcrypto;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  title text,
  source text not null default 'coach',
  last_message_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.ai_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id text not null,
  role text not null check (role in ('system', 'user', 'assistant')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_conversation_messages_conversation_fk
    foreign key (conversation_id, user_id)
    references public.ai_conversations (id, user_id)
    on delete cascade
);

create table if not exists public.ai_daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  review_date date not null,
  headline text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  model text,
  source text not null default 'coach',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, review_date)
);

create table if not exists public.ai_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  week_start date not null,
  headline text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  model text,
  source text not null default 'coach',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

create index if not exists ai_conversation_messages_thread_idx
  on public.ai_conversation_messages (conversation_id, created_at asc);

create index if not exists ai_daily_reviews_user_date_idx
  on public.ai_daily_reviews (user_id, review_date desc);

create index if not exists ai_weekly_reviews_user_week_idx
  on public.ai_weekly_reviews (user_id, week_start desc);

create or replace function public.paceframe_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists paceframe_ai_conversations_updated_at on public.ai_conversations;
create trigger paceframe_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.paceframe_set_updated_at();

drop trigger if exists paceframe_ai_daily_reviews_updated_at on public.ai_daily_reviews;
create trigger paceframe_ai_daily_reviews_updated_at
before update on public.ai_daily_reviews
for each row execute function public.paceframe_set_updated_at();

drop trigger if exists paceframe_ai_weekly_reviews_updated_at on public.ai_weekly_reviews;
create trigger paceframe_ai_weekly_reviews_updated_at
before update on public.ai_weekly_reviews
for each row execute function public.paceframe_set_updated_at();

alter table public.ai_conversations enable row level security;
alter table public.ai_conversation_messages enable row level security;
alter table public.ai_daily_reviews enable row level security;
alter table public.ai_weekly_reviews enable row level security;

drop policy if exists "ai conversations manage own rows" on public.ai_conversations;
create policy "ai conversations manage own rows"
on public.ai_conversations
for all
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "ai conversation messages manage own rows" on public.ai_conversation_messages;
create policy "ai conversation messages manage own rows"
on public.ai_conversation_messages
for all
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "ai daily reviews manage own rows" on public.ai_daily_reviews;
create policy "ai daily reviews manage own rows"
on public.ai_daily_reviews
for all
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists "ai weekly reviews manage own rows" on public.ai_weekly_reviews;
create policy "ai weekly reviews manage own rows"
on public.ai_weekly_reviews
for all
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);
