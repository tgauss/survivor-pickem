-- Playoff tiebreaker picks table
CREATE TABLE playoff_tiebreaker_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  week_id UUID NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id VARCHAR(10) REFERENCES teams(id),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  result VARCHAR(10) CHECK (result IN ('pending', 'win', 'loss', 'tie')) DEFAULT 'pending',
  UNIQUE(entry_id, game_id)
);

-- Views for common queries

-- View: Entry's used teams for the season
CREATE OR REPLACE VIEW v_entry_used_teams AS
SELECT 
  e.id AS entry_id,
  e.league_id,
  l.season_year,
  ARRAY_AGG(DISTINCT p.team_id ORDER BY p.team_id) AS used_teams
FROM entries e
JOIN leagues l ON e.league_id = l.id
LEFT JOIN picks p ON p.entry_id = e.id
WHERE p.team_id IS NOT NULL
GROUP BY e.id, e.league_id, l.season_year;

-- View: Week submission progress
CREATE OR REPLACE VIEW v_week_submission_progress AS
SELECT 
  w.id AS week_id,
  l.id AS league_id,
  w.week_no,
  w.phase,
  COUNT(DISTINCT e.id) FILTER (WHERE NOT e.eliminated) AS alive_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.submitted_at IS NOT NULL AND NOT e.eliminated) AS submitted_count,
  COUNT(DISTINCT e.id) AS total_entries,
  CASE 
    WHEN COUNT(DISTINCT e.id) FILTER (WHERE NOT e.eliminated) = 
         COUNT(DISTINCT p.id) FILTER (WHERE p.submitted_at IS NOT NULL AND NOT e.eliminated)
    THEN false
    WHEN w.last_kickoff_at < CURRENT_TIMESTAMP THEN false
    ELSE true
  END AS concealed
FROM weeks w
CROSS JOIN leagues l
LEFT JOIN entries e ON e.league_id = l.id
LEFT JOIN picks p ON p.week_id = w.id AND p.entry_id = e.id
WHERE l.season_year = w.season_year
GROUP BY w.id, l.id, w.week_no, w.phase, w.last_kickoff_at;

-- View: Pick distribution for revealed weeks
CREATE OR REPLACE VIEW v_pick_distribution AS
SELECT 
  w.id AS week_id,
  l.id AS league_id,
  p.team_id,
  t.abbr AS team_abbr,
  COUNT(*) AS pick_count
FROM picks p
JOIN weeks w ON p.week_id = w.id
JOIN entries e ON p.entry_id = e.id
JOIN leagues l ON e.league_id = l.id
LEFT JOIN teams t ON p.team_id = t.id
WHERE p.team_id IS NOT NULL
  AND (w.revealed_at IS NOT NULL OR w.last_kickoff_at < CURRENT_TIMESTAMP)
GROUP BY w.id, l.id, p.team_id, t.abbr;

-- View: Leaderboard data per entry per week
CREATE OR REPLACE VIEW v_leaderboard_entry_week AS
SELECT 
  e.id AS entry_id,
  e.league_id,
  w.id AS week_id,
  w.week_no,
  e.username,
  e.display_name,
  e.real_name,
  e.avatar_url,
  e.strikes,
  e.eliminated,
  e.opted_in,
  e.paid,
  p.team_id AS pick_team_id,
  t.abbr AS pick_team_abbr,
  p.submitted_at IS NOT NULL AS has_submitted,
  p.result AS pick_result,
  CASE 
    WHEN wsp.concealed AND NOT e.eliminated THEN true
    ELSE false
  END AS pick_concealed
FROM entries e
CROSS JOIN weeks w
LEFT JOIN picks p ON p.entry_id = e.id AND p.week_id = w.id
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN v_week_submission_progress wsp ON wsp.week_id = w.id AND wsp.league_id = e.league_id
WHERE EXISTS (
  SELECT 1 FROM leagues l 
  WHERE l.id = e.league_id AND l.season_year = w.season_year
);

-- Indexes for playoff tiebreaker picks
CREATE INDEX idx_playoff_picks_league ON playoff_tiebreaker_picks(league_id);
CREATE INDEX idx_playoff_picks_entry ON playoff_tiebreaker_picks(entry_id);
CREATE INDEX idx_playoff_picks_week ON playoff_tiebreaker_picks(week_id);
CREATE INDEX idx_playoff_picks_game ON playoff_tiebreaker_picks(game_id);