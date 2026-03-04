-- Rippl Supabase schema

create extension if not exists "pgcrypto";

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  emoji text default '👥',
  created_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  user_id text not null,
  name text,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists public.group_shares (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  from_user_id text not null,
  token text not null unique,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sent_emails (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subject text,
  body text,
  recipient_count int,
  group_ids text[],
  sent_at timestamptz default now(),
  status text default 'sent'
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text,
  location text,
  start_time timestamptz,
  end_time timestamptz,
  group_ids text[],
  google_event_id text,
  created_at timestamptz default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  title text,
  detail text,
  status text default 'scheduled',
  scheduled_at timestamptz,
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null, -- 'gmail' | 'calendar' | 'openrouter'
  access_token text,
  refresh_token text,
  expiry_date timestamptz,
  data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.group_shares enable row level security;
alter table public.sent_emails enable row level security;
alter table public.events enable row level security;
alter table public.reminders enable row level security;
alter table public.user_integrations enable row level security;

create policy "Users can manage their own groups"
on public.groups
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can manage their own group_shares"
on public.group_shares
for all
using (auth.uid()::text = from_user_id)
with check (auth.uid()::text = from_user_id);

create policy "Users can manage their own members"
on public.members
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can read their own sent_emails"
on public.sent_emails
for select
using (auth.uid()::text = user_id);

create policy "Users can insert their own sent_emails"
on public.sent_emails
for insert
with check (auth.uid()::text = user_id);

create policy "Users can read their own events"
on public.events
for select
using (auth.uid()::text = user_id);

create policy "Users can manage their own reminders"
on public.reminders
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can manage their own integrations"
on public.user_integrations
for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create table if not exists public.user_preferences (
  user_id text primary key,
  email_signature text default '',
  default_tone text default 'professional',
  send_confirmation boolean default true,
  updated_at timestamptz default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.user_preferences enable row level security;
create policy "Users can manage their own user_preferences"
on public.user_preferences for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

alter table public.activity_log enable row level security;

create policy "Users can read their own activity_log"
on public.activity_log
for select
using (auth.uid()::text = user_id);

create policy "Users can insert their own activity_log"
on public.activity_log
for insert
with check (auth.uid()::text = user_id);

