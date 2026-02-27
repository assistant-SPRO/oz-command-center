-- ============================================================
-- Oz Command Center - Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com dashboard)
-- ============================================================

-- Oz current status (single row)
create table oz_status (
  id uuid default gen_random_uuid() primary key,
  is_online boolean default false,
  current_task text,
  last_active timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activity log
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  timestamp timestamptz default now(),
  task_type text not null,
  description text not null,
  outcome text check (outcome in ('success','failed','partial')),
  duration_seconds integer,
  error_message text,
  metadata jsonb
);

-- Task board
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo','in_progress','done')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  created_by text default 'oz'
);

-- Security checks
create table security_checks (
  id uuid default gen_random_uuid() primary key,
  checked_at timestamptz default now(),
  firewall_status boolean,
  open_ports text[],
  tailscale_connected boolean,
  tailscale_devices text[],
  github_backup_last timestamptz,
  github_backup_status text,
  notes text
);

-- API health
create table api_health (
  id uuid default gen_random_uuid() primary key,
  checked_at timestamptz default now(),
  service text not null,
  status text check (status in ('healthy','degraded','down')),
  response_ms integer,
  error_message text
);

-- ============================================================
-- Enable Row Level Security
-- ============================================================
alter table oz_status enable row level security;
alter table activity_log enable row level security;
alter table tasks enable row level security;
alter table security_checks enable row level security;
alter table api_health enable row level security;

-- ============================================================
-- RLS Policies - Read access for anon (dashboard), write for service role
-- ============================================================

-- oz_status: anon can read, service role can write
create policy "anon_read_oz_status" on oz_status for select using (true);
create policy "service_write_oz_status" on oz_status for all using (auth.role() = 'service_role');

-- activity_log: anon can read, service role can write
create policy "anon_read_activity_log" on activity_log for select using (true);
create policy "service_write_activity_log" on activity_log for all using (auth.role() = 'service_role');

-- tasks: anon can read, service role can write
create policy "anon_read_tasks" on tasks for select using (true);
create policy "service_write_tasks" on tasks for all using (auth.role() = 'service_role');

-- security_checks: anon can read, service role can write
create policy "anon_read_security_checks" on security_checks for select using (true);
create policy "service_write_security_checks" on security_checks for all using (auth.role() = 'service_role');

-- api_health: anon can read, service role can write
create policy "anon_read_api_health" on api_health for select using (true);
create policy "service_write_api_health" on api_health for all using (auth.role() = 'service_role');

-- ============================================================
-- Enable Realtime on all tables
-- ============================================================
alter publication supabase_realtime add table oz_status;
alter publication supabase_realtime add table activity_log;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table security_checks;
alter publication supabase_realtime add table api_health;

-- ============================================================
-- Insert initial oz_status row
-- ============================================================
insert into oz_status (is_online, current_task) values (false, null);
