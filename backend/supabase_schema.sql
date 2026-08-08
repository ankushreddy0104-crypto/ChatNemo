-- ============================================================
-- ChatNemo — Supabase PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users ──────────────────────────────────────────────────
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  full_name     text,
  avatar_url    text,
  password_hash text not null,
  settings      jsonb default '{}'::jsonb,
  created_at    timestamptz default now()
);

-- ── Conversations ──────────────────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text not null default 'New Chat',
  model      text not null,
  pinned     boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.conversations(user_id, updated_at desc);

-- ── Messages ───────────────────────────────────────────────
create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant', 'system')),
  content          text not null,
  model            text,
  tokens_used      int,
  response_time_ms int,
  created_at       timestamptz default now()
);
create index on public.messages(conversation_id, created_at);

-- ── Saved Prompts ──────────────────────────────────────────
create table if not exists public.saved_prompts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  title       text not null,
  content     text not null,
  category    text default 'General',
  is_favorite boolean default false,
  created_at  timestamptz default now()
);
create index on public.saved_prompts(user_id, category);

-- ── RLS: users can only see their own data ─────────────────
alter table public.users            enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.saved_prompts    enable row level security;

-- Service role bypasses RLS (used by FastAPI)
-- No policies needed when using service key
