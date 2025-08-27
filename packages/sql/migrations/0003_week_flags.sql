-- Add rolled_back flag to weeks table
ALTER TABLE public.weeks 
ADD COLUMN IF NOT EXISTS rolled_back BOOLEAN NOT NULL DEFAULT false;

-- Add admin view events table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_view_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  week_id UUID REFERENCES weeks(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for admin view events
CREATE INDEX IF NOT EXISTS idx_admin_view_events_admin ON admin_view_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_view_events_league ON admin_view_events(league_id);
CREATE INDEX IF NOT EXISTS idx_admin_view_events_week ON admin_view_events(week_id);