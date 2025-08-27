-- Enable Row Level Security on all tables
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playoff_tiebreaker_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE results_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_view_events ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies (temporary - to be replaced with proper RLS)
-- These allow the service_role key to bypass RLS for all operations

CREATE POLICY service_role_all ON leagues
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON league_admins
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON entries
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON invites
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON teams
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON weeks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON games
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON picks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON playoff_tiebreaker_picks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON pick_audits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON results_sync_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY service_role_all ON admin_view_events
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Implement proper RLS policies for authenticated users
-- These would include:
-- 1. Users can view their own entries
-- 2. Users can view leagues they belong to
-- 3. Users can submit picks for their own entries
-- 4. Users can view revealed picks only
-- 5. Admins have additional privileges for their leagues
-- 6. Chat messages respect league membership
-- 7. Session-based authentication checks