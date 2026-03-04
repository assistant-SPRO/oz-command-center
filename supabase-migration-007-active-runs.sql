-- Migration 007: active_runs table
-- Tracks currently running agent tasks for live dashboard display
-- Written by the bot at turn start, updated at turn end

CREATE TABLE IF NOT EXISTS active_runs (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent            text NOT NULL,                    -- 'oz_master', 'morning_brief', etc.
  task             text NOT NULL,                    -- description of what's happening
  source           text DEFAULT 'telegram',          -- 'telegram', 'cron', 'manual'
  started_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  estimated_end_at timestamptz,                      -- null = unknown ETA
  elapsed_ms       integer DEFAULT 0,                -- updated periodically
  progress_pct     integer DEFAULT 0,                -- 0-100
  status           text DEFAULT 'running',           -- 'running', 'done', 'failed'
  metadata         jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_active_runs_status  ON active_runs(status);
CREATE INDEX IF NOT EXISTS idx_active_runs_started ON active_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_runs_agent   ON active_runs(agent);

ALTER TABLE active_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_read_active_runs"    ON active_runs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_write_active_runs" ON active_runs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_update_active_runs" ON active_runs FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "service_delete_active_runs" ON active_runs FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE active_runs;
