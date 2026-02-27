-- ============================================================
-- Migration 002: Claude Usage Tracking
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Claude usage log - tracks every interaction
create table claude_usage (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz default now(),
  source text not null check (source in ('telegram', 'claude_code', 'api')),
  model text not null,
  input_tokens integer default 0,
  output_tokens integer default 0,
  cache_read_tokens integer default 0,
  cache_write_tokens integer default 0,
  total_tokens integer generated always as (input_tokens + output_tokens) stored,
  estimated_api_cost numeric(10,6) default 0,
  task_description text,
  session_id text,
  duration_seconds integer,
  metadata jsonb
);

-- Enable RLS
alter table claude_usage enable row level security;

-- Policies
create policy "anon_read_claude_usage" on claude_usage for select using (true);
create policy "service_write_claude_usage" on claude_usage for all using (auth.role() = 'service_role');

-- Enable Realtime
alter publication supabase_realtime add table claude_usage;

-- Add index for common queries
create index idx_claude_usage_timestamp on claude_usage (timestamp desc);
create index idx_claude_usage_model on claude_usage (model);
create index idx_claude_usage_source on claude_usage (source);
