-- Migration 004: Allow anon key to create/update tasks from dashboard
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nojcoizimanzwbwuhwui/sql

-- Allow dashboard (anon key) to insert new tasks
CREATE POLICY "anon_insert_tasks" ON tasks
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow dashboard (anon key) to update task status/priority
CREATE POLICY "anon_update_tasks" ON tasks
  FOR UPDATE TO anon
  USING (true);

-- Add system_info column to oz_status for heartbeat metrics
ALTER TABLE oz_status ADD COLUMN IF NOT EXISTS system_info jsonb;

-- Clean stale test data
DELETE FROM activity_log WHERE description LIKE '%Built Oz%' OR description LIKE '%panels%';
DELETE FROM tasks WHERE title IN (
  'Set up automated security scans',
  'Wire up API health pinging',
  'Add Claude usage auto-logging',
  'Build Oz Command Center v1',
  'Set up Supabase schema',
  'Connect GitHub repo'
);
DELETE FROM security_checks WHERE notes = 'All systems nominal. Firewall active, Tailscale mesh healthy.';
