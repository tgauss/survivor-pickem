-- Create league_managers table for management permissions
CREATE TABLE league_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permissions JSONB NOT NULL DEFAULT '{
    "can_invite": true,
    "can_manage_payments": true,
    "can_manage_entries": true,
    "can_manage_games": false
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_league_managers_league_id ON league_managers(league_id);
CREATE INDEX idx_league_managers_user_id ON league_managers(user_id);
CREATE UNIQUE INDEX idx_league_managers_unique ON league_managers(league_id, user_id);