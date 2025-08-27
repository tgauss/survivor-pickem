-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  season_year INTEGER NOT NULL,
  league_code VARCHAR(50) UNIQUE NOT NULL,
  buy_in_cents INTEGER NOT NULL DEFAULT 0,
  display_timezone VARCHAR(50) DEFAULT 'America/New_York',
  include_playoffs BOOLEAN DEFAULT true,
  include_super_bowl BOOLEAN DEFAULT false,
  tiebreaker_mode VARCHAR(50) DEFAULT 'playoff_multi',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- League admins junction table
CREATE TABLE league_admins (
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL,
  PRIMARY KEY (league_id, entry_id)
);

-- Entries table
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  real_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  pin_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  strikes INTEGER DEFAULT 0,
  eliminated BOOLEAN DEFAULT false,
  opted_in BOOLEAN DEFAULT false,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(league_id, display_name)
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  claimed_by_entry UUID REFERENCES entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id VARCHAR(10) PRIMARY KEY,
  abbr VARCHAR(5) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,
  name VARCHAR(50) NOT NULL,
  espn_team_id INTEGER,
  logo_url TEXT
);

-- Weeks table
CREATE TABLE weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_year INTEGER NOT NULL,
  week_no INTEGER NOT NULL,
  phase VARCHAR(20) CHECK (phase IN ('regular', 'wild_card', 'divisional', 'conference', 'super_bowl')),
  round_order INTEGER,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  last_kickoff_at TIMESTAMP WITH TIME ZONE,
  revealed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(season_year, week_no)
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  home_team VARCHAR(10) REFERENCES teams(id),
  away_team VARCHAR(10) REFERENCES teams(id),
  kickoff_at TIMESTAMP WITH TIME ZONE NOT NULL,
  neutral_site BOOLEAN DEFAULT false,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'final')) DEFAULT 'scheduled',
  winner_team VARCHAR(10) REFERENCES teams(id),
  espn_game_id VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  team_id VARCHAR(10) REFERENCES teams(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  locked BOOLEAN DEFAULT true,
  result VARCHAR(10) CHECK (result IN ('pending', 'win', 'loss', 'tie')) DEFAULT 'pending',
  UNIQUE(entry_id, week_id)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  week_id UUID REFERENCES weeks(id) ON DELETE SET NULL,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pick audits table
CREATE TABLE pick_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pick_id UUID NOT NULL REFERENCES picks(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id),
  week_id UUID NOT NULL REFERENCES weeks(id),
  old_team_id VARCHAR(10) REFERENCES teams(id),
  new_team_id VARCHAR(10) REFERENCES teams(id),
  old_game_id UUID REFERENCES games(id),
  new_game_id UUID REFERENCES games(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  changed_by UUID REFERENCES entries(id),
  reason TEXT
);

-- Results sync log table
CREATE TABLE results_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL,
  ran_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  summary JSONB
);

-- Admin view events table (for tracking admin peeks)
CREATE TABLE admin_view_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES entries(id),
  league_id UUID NOT NULL REFERENCES leagues(id),
  week_id UUID REFERENCES weeks(id),
  reason TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_entries_league ON entries(league_id);
CREATE INDEX idx_picks_entry ON picks(entry_id);
CREATE INDEX idx_picks_week ON picks(week_id);
CREATE INDEX idx_games_week ON games(week_id);
CREATE INDEX idx_messages_league ON messages(league_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);