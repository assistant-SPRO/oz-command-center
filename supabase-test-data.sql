-- ============================================================
-- Test Data for Oz Command Center
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update oz_status to online
UPDATE oz_status SET
  is_online = true,
  current_task = 'Monitoring dashboard systems',
  last_active = now(),
  updated_at = now();

-- Activity log entries
INSERT INTO activity_log (task_type, description, outcome, duration_seconds, metadata) VALUES
  ('build', 'Built Oz Command Center dashboard with React + Tailwind', 'success', 3600, '{"panels": 8, "stack": "vite+react+supabase"}'),
  ('deploy', 'Deployed dashboard to Vercel production', 'success', 45, '{"url": "oz-command-center.vercel.app"}'),
  ('email', 'Checked Gmail inbox - 3 new messages', 'success', 12, '{"messages": 3}'),
  ('calendar', 'Reviewed calendar for the week', 'success', 8, null),
  ('security', 'Ran daily security scan on Mac Mini', 'success', 30, '{"firewall": true, "open_ports": 0}'),
  ('health_check', 'Hourly API health check completed', 'success', 5, '{"services_checked": 6}'),
  ('build', 'Added Claude usage tracking panels', 'success', 1800, '{"new_panels": 3}');

-- Task board entries
INSERT INTO tasks (title, description, status, priority, created_by) VALUES
  ('Set up automated security scans', 'Configure daily cron for firewall, port, and Tailscale checks', 'todo', 'high', 'oz'),
  ('Wire up API health pinging', 'Hourly pings to Telegram, Groq, Google AI, Brave, ElevenLabs, GitHub', 'in_progress', 'high', 'oz'),
  ('Add Claude usage auto-logging', 'Track every interaction with model, tokens, and cost estimate', 'todo', 'urgent', 'oz'),
  ('Build Oz Command Center v1', 'React + Tailwind dashboard with 5 panels, deployed to Vercel', 'done', 'urgent', 'oz'),
  ('Set up Supabase schema', 'Created 6 tables with RLS and realtime enabled', 'done', 'high', 'oz'),
  ('Connect GitHub repo', 'oz-command-center repo created and linked to Vercel', 'done', 'normal', 'oz');

-- Security check entry
INSERT INTO security_checks (firewall_status, open_ports, tailscale_connected, tailscale_devices, github_backup_last, github_backup_status, notes) VALUES
  (true, ARRAY['22', '443'], true, ARRAY['mac-mini-denver', 'craigs-mbp'], now() - interval '2 hours', 'success', 'All systems nominal. Firewall active, Tailscale mesh healthy.');

-- API health entries
INSERT INTO api_health (service, status, response_ms) VALUES
  ('Telegram', 'healthy', 142),
  ('Groq', 'healthy', 89),
  ('Google AI Studio', 'healthy', 203),
  ('Brave Search', 'healthy', 167),
  ('ElevenLabs', 'healthy', 312),
  ('GitHub', 'healthy', 95);

-- Claude usage entries (last 7 days of sample data)
INSERT INTO claude_usage (timestamp, source, model, input_tokens, output_tokens, cache_read_tokens, estimated_api_cost, task_description) VALUES
  (now() - interval '6 days', 'telegram', 'claude-sonnet-4-20250514', 1200, 800, 400, 0.018, 'Email inbox check'),
  (now() - interval '6 days', 'claude_code', 'claude-sonnet-4-20250514', 15000, 8000, 5000, 0.165, 'Building Oz Command Center'),
  (now() - interval '5 days', 'telegram', 'claude-sonnet-4-20250514', 800, 500, 200, 0.011, 'Calendar review'),
  (now() - interval '5 days', 'claude_code', 'claude-opus-4-20250514', 20000, 12000, 8000, 1.200, 'Complex architecture planning'),
  (now() - interval '4 days', 'telegram', 'claude-sonnet-4-20250514', 1500, 1000, 600, 0.021, 'Slack message summary'),
  (now() - interval '4 days', 'claude_code', 'claude-sonnet-4-20250514', 18000, 10000, 7000, 0.195, 'Dashboard panel development'),
  (now() - interval '3 days', 'telegram', 'claude-sonnet-4-20250514', 900, 600, 300, 0.012, 'Quick question about n8n'),
  (now() - interval '3 days', 'claude_code', 'claude-sonnet-4-20250514', 12000, 6000, 4000, 0.126, 'Supabase schema setup'),
  (now() - interval '2 days', 'telegram', 'claude-sonnet-4-20250514', 2000, 1500, 800, 0.030, 'Denver Conference Video pricing review'),
  (now() - interval '2 days', 'claude_code', 'claude-opus-4-20250514', 25000, 15000, 10000, 1.500, 'Full stack debugging session'),
  (now() - interval '1 day', 'telegram', 'claude-sonnet-4-20250514', 1100, 700, 350, 0.015, 'Drum lesson scheduling'),
  (now() - interval '1 day', 'claude_code', 'claude-sonnet-4-20250514', 16000, 9000, 6000, 0.180, 'Adding Claude usage panels'),
  (now() - interval '12 hours', 'telegram', 'claude-sonnet-4-20250514', 600, 400, 200, 0.009, 'Weather check'),
  (now() - interval '6 hours', 'claude_code', 'claude-sonnet-4-20250514', 14000, 7000, 5000, 0.147, 'Cost analysis panel build'),
  (now() - interval '2 hours', 'telegram', 'claude-sonnet-4-20250514', 1800, 1200, 500, 0.024, 'Supabase setup walkthrough'),
  (now() - interval '30 minutes', 'claude_code', 'claude-sonnet-4-20250514', 10000, 5000, 3000, 0.105, 'Test data insertion');
