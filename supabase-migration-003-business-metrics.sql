-- ============================================================
-- Migration 003: Business Metrics
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Business metrics - track status/pipeline per business
create table business_metrics (
  id uuid default gen_random_uuid() primary key,
  business_key text not null check (business_key in ('dcv', 'spai', 'nmm')),
  status text check (status in ('active', 'paused', 'ramping')),
  pipeline_value numeric(10,2),
  active_clients integer default 0,
  notes text,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table business_metrics enable row level security;

-- Policies
create policy "anon_read_business_metrics" on business_metrics for select using (true);
create policy "service_write_business_metrics" on business_metrics for all using (auth.role() = 'service_role');

-- Enable Realtime
alter publication supabase_realtime add table business_metrics;

-- Insert initial data for Craig's 3 businesses
INSERT INTO business_metrics (business_key, status, pipeline_value, active_clients, notes) VALUES
  ('dcv', 'active', 15000, 2, 'Targeting mid-size conferences in CO. 2 active leads.'),
  ('spai', 'active', 5000, 1, 'Serving existing network. 1 active client.'),
  ('nmm', 'paused', 0, 0, 'Depends on Jack bandwidth. On hold for now.');
