-- Run this in the Supabase SQL editor before using /api/sync routes.

create table if not exists public.user_sync_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_sync_state enable row level security;

-- Users can only read/write their own sync state when using anon/authenticated clients.
create policy if not exists "user_sync_state_select_own"
on public.user_sync_state
for select
using (auth.uid() = user_id);

create policy if not exists "user_sync_state_insert_own"
on public.user_sync_state
for insert
with check (auth.uid() = user_id);

create policy if not exists "user_sync_state_update_own"
on public.user_sync_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Server route handlers use service_role and bypass RLS.
