-- Migration 006: Create agent_logs and cron_runs tables
-- These tables are written by the ClaudeClaw daemon (supabase.ts)
-- and were silently failing because the tables didn't exist.
-- Run in Supabase SQL Editor.

-- ============================================
-- PART 1: agent_logs
-- Every bot turn, cron action, and tool use gets logged here.
-- Written by logAgentAction() in claudeclaw/src/supabase.ts
-- ============================================

CREATE TABLE IF NOT EXISTS agent_logs (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent       text NOT NULL,             -- 'oz_master', 'dcv_agent', etc.
  action      text NOT NULL,             -- first 120 chars of the user message / action taken
  brand       text DEFAULT 'system',     -- business context: 'dcv', 'streamline', 'system'
  success     boolean DEFAULT true,
  error_msg   text,                      -- error message if success = false
  tokens_used integer,                   -- total tokens for this turn
  duration_ms integer,                   -- ms elapsed from message received to response sent
  metadata    jsonb DEFAULT '{}'::jsonb, -- session_id, chat_id, model, cost_usd, error_type
  created_at  timestamptz DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_created   ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent      ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_success    ON agent_logs(success);
CREATE INDEX IF NOT EXISTS idx_agent_logs_metadata   ON agent_logs USING gin(metadata);

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_read_agent_logs" ON agent_logs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_write_agent_logs" ON agent_logs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_update_agent_logs" ON agent_logs FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;


-- ============================================
-- PART 2: cron_runs
-- Every scheduled job (heartbeat, brief, backup, sync) logs here.
-- Written by logCronStart() / logCronComplete() in claudeclaw/src/supabase.ts
-- ============================================

CREATE TABLE IF NOT EXISTS cron_runs (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_name    text NOT NULL,              -- 'morning_brief', 'heartbeat', 'nightly_backup', etc.
  status       text DEFAULT 'running'      -- 'running', 'success', 'failed'
               CHECK (status IN ('running', 'success', 'failed')),
  started_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_ms  integer,
  tokens_used  integer,
  output       text,                       -- summary / result of the run
  error_msg    text,
  success      boolean,
  metadata     jsonb DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cron_runs_started  ON cron_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_runs_name     ON cron_runs(cron_name);
CREATE INDEX IF NOT EXISTS idx_cron_runs_status   ON cron_runs(status);

-- RLS
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_read_cron_runs" ON cron_runs FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_write_cron_runs" ON cron_runs FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "service_update_cron_runs" ON cron_runs FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Real-time
ALTER PUBLICATION supabase_realtime ADD TABLE cron_runs;


-- ============================================
-- VERIFICATION
-- ============================================
SELECT
  'Migration 006 complete' AS status,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'agent_logs')  AS agent_logs_exists,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'cron_runs')   AS cron_runs_exists;
