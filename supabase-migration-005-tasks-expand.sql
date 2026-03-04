-- Migration 005: Expand tasks table + create meeting_notes table
-- Run in Supabase SQL Editor or via psql

-- ============================================
-- PART 1: Expand tasks table with new columns
-- ============================================

-- Business association (null = personal task)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS business_key text;

-- Who is assigned to this task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee text DEFAULT 'Craig';

-- When is it due
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamptz;

-- Category of task
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category text DEFAULT 'work';
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_category_check
    CHECK (category IN ('work', 'personal', 'errand', 'meeting_action'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Where did this task come from
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
DO $$ BEGIN
  ALTER TABLE tasks ADD CONSTRAINT tasks_source_check
    CHECK (source IN ('manual', 'meeting', 'telegram', 'dashboard'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Link to meeting_notes if task came from a meeting
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_ref text;

-- Google Calendar event ID if pushed to calendar
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS calendar_event_id text;

-- When to send a reminder notification
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_at timestamptz;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_business ON tasks(business_key) WHERE business_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee) WHERE assignee IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_reminder ON tasks(reminder_at) WHERE reminder_at IS NOT NULL AND status != 'done';
CREATE INDEX IF NOT EXISTS idx_tasks_source_ref ON tasks(source_ref) WHERE source_ref IS NOT NULL;

-- ============================================
-- PART 2: Create meeting_notes table
-- ============================================

CREATE TABLE IF NOT EXISTS meeting_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  meeting_date timestamptz NOT NULL,
  participants jsonb DEFAULT '[]'::jsonb,
  transcript_raw text,
  summary text,
  key_decisions jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  business_key text,
  source text DEFAULT 'manual' CHECK (source IN ('zoom', 'manual', 'otter', 'google_meet')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_read_meeting_notes" ON meeting_notes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "anon_insert_meeting_notes" ON meeting_notes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "anon_update_meeting_notes" ON meeting_notes FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_notes;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_notes_date ON meeting_notes(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_business ON meeting_notes(business_key) WHERE business_key IS NOT NULL;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Migration 005 complete' as status,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'tasks') as tasks_columns,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'meeting_notes') as meeting_notes_exists;
