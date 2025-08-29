-- NFL Survivor Pool Platform Database Schema
-- Generated: August 28, 2025
-- Project: pickem live (bnhmkyliothxmuzvqato)
-- Database: PostgreSQL 17.4.1.074

-- =============================================================================
-- TABLE DEFINITIONS
-- =============================================================================

-- Users table - Core user authentication and profile data
CREATE TABLE users (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username varchar(50) NOT NULL UNIQUE,
    pin_hash varchar(255) NOT NULL,
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    email varchar(255) NOT NULL,
    phone varchar(20) NOT NULL,
    avatar_url text,
    role varchar(20) NOT NULL DEFAULT 'player' 
        CHECK (role IN ('super_admin', 'league_manager', 'player')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Sessions table - User session management
CREATE TABLE sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_token varchar(255) NOT NULL UNIQUE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Leagues table - Survivor pool league configuration
CREATE TABLE leagues (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar(255) NOT NULL,
    season_year integer NOT NULL,
    league_code varchar(50) NOT NULL UNIQUE,
    buy_in_cents integer NOT NULL DEFAULT 0,
    display_timezone varchar(50) DEFAULT 'America/New_York',
    include_playoffs boolean DEFAULT true,
    include_super_bowl boolean DEFAULT false,
    tiebreaker_mode varchar(50) DEFAULT 'playoff_multi',
    created_by_user_id uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- League managers table - User permissions for league management
CREATE TABLE league_managers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id varchar(255) NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions jsonb NOT NULL DEFAULT '{"can_invite": true, "can_manage_games": false, "can_manage_entries": true, "can_manage_payments": true}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Entries table - User entries/participations in leagues
CREATE TABLE entries (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name varchar(100) NOT NULL,
    username varchar(50) NOT NULL,
    strikes integer DEFAULT 0,
    eliminated boolean DEFAULT false,
    opted_in boolean DEFAULT false,
    paid boolean DEFAULT false,
    is_paid boolean DEFAULT false,
    paid_at timestamp with time zone,
    is_alive boolean DEFAULT true,
    unique_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (league_id, display_name)
);

-- League admins table - Entry-based admin permissions (legacy)
CREATE TABLE league_admins (
    league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    entry_id uuid NOT NULL,
    PRIMARY KEY (league_id, entry_id)
);

-- Teams table - NFL team data and branding
CREATE TABLE teams (
    id varchar(10) NOT NULL PRIMARY KEY,
    abbr varchar(5) NOT NULL UNIQUE,
    city varchar(50) NOT NULL,
    name varchar(50) NOT NULL,
    espn_team_id integer,
    logo_url text,
    primary_color text,
    secondary_color text,
    tertiary_color text,
    quaternary_color text,
    wiki_logo_url text,
    wiki_wordmark_url text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Weeks table - NFL season weeks and playoff phases
CREATE TABLE weeks (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    season_year integer NOT NULL,
    week_no integer NOT NULL,
    phase varchar(20) CHECK (phase IN ('regular', 'wild_card', 'divisional', 'conference', 'super_bowl')),
    round_order integer,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    last_kickoff_at timestamp with time zone,
    revealed_at timestamp with time zone,
    rolled_back boolean NOT NULL DEFAULT false,
    sportsdata_week integer,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (season_year, week_no)
);

-- Games table - NFL games and results
CREATE TABLE games (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    home_team varchar(10) REFERENCES teams(id),
    away_team varchar(10) REFERENCES teams(id),
    kickoff_at timestamp with time zone NOT NULL,
    neutral_site boolean DEFAULT false,
    status varchar(20) DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'final')),
    winner_team varchar(10) REFERENCES teams(id),
    espn_game_id varchar(50),
    sportsdata_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Picks table - User picks for each week
CREATE TABLE picks (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    game_id uuid REFERENCES games(id) ON DELETE SET NULL,
    team_id varchar(10) REFERENCES teams(id),
    submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    locked boolean DEFAULT true,
    result varchar(10) DEFAULT 'pending' 
        CHECK (result IN ('pending', 'win', 'loss', 'tie')),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (entry_id, week_id)
);

-- Pick audits table - Track changes to picks
CREATE TABLE pick_audits (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    pick_id uuid NOT NULL REFERENCES picks(id) ON DELETE CASCADE,
    entry_id uuid NOT NULL REFERENCES entries(id),
    week_id uuid NOT NULL REFERENCES weeks(id),
    old_team_id varchar(10) REFERENCES teams(id),
    new_team_id varchar(10) REFERENCES teams(id),
    old_game_id uuid REFERENCES games(id),
    new_game_id uuid REFERENCES games(id),
    changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    changed_by uuid REFERENCES entries(id),
    reason text
);

-- Invites table - League invitation system
CREATE TABLE invites (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,
    token varchar(255) NOT NULL UNIQUE,
    created_by_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    claimed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    max_uses integer,
    current_uses integer NOT NULL DEFAULT 0,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    claimed_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Messages table - League messaging system
CREATE TABLE messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    week_id uuid REFERENCES weeks(id) ON DELETE SET NULL,
    entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    body text NOT NULL,
    is_spoiler boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Admin view events table - Track admin page views
CREATE TABLE admin_view_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES entries(id),
    league_id uuid NOT NULL REFERENCES leagues(id),
    week_id uuid REFERENCES weeks(id),
    reason text NOT NULL,
    viewed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Results sync log table - Track external data synchronization
CREATE TABLE results_sync_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    source varchar(50) NOT NULL,
    ran_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status varchar(20) NOT NULL,
    summary jsonb
);

-- =============================================================================
-- INDEXES (Auto-generated by PostgreSQL for constraints)
-- =============================================================================

-- Primary Keys create unique indexes automatically
-- Foreign Keys create indexes automatically  
-- Unique constraints create unique indexes automatically

-- Additional performance indexes would be added here as needed

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - ENABLED BUT STUB POLICIES
-- =============================================================================

-- RLS is enabled on tables with stub policies for future expansion
-- Currently using service role key server-side, so policies are permissive

-- =============================================================================
-- NOTES
-- =============================================================================

-- 1. This schema supports user-based authentication (migrated from entry-based)
-- 2. Teams table uses varchar(10) IDs that match team abbreviations  
-- 3. Session management uses UUID tokens with expiration
-- 4. League codes are user-friendly strings like "2024-survivor"
-- 5. Picks are unique per entry per week (survivor pool rule)
-- 6. Games status flows: scheduled -> in_progress -> final
-- 7. Pick results: pending -> win/loss/tie (resolved when games are final)
-- 8. Playoff phases: regular, wild_card, divisional, conference, super_bowl
-- 9. All timestamps use timezone-aware types for proper time handling
-- 10. Foreign key cascades ensure data integrity during deletions

-- =============================================================================
-- CURRENT DATA VOLUME (as of snapshot date)
-- =============================================================================

-- Users: ~10-50 users
-- Leagues: ~1-5 leagues  
-- Teams: 32 NFL teams
-- Weeks: ~22 weeks per season (18 regular + 4 playoff)
-- Games: ~272 games per season (17 games x 16 weeks regular season + playoffs)
-- Entries: Variable per league
-- Picks: One per entry per week
-- Sessions: Active user sessions

-- =============================================================================
-- CRITICAL AUTHENTICATION ISSUE (as of August 28, 2025)
-- =============================================================================

-- ISSUE: Session cookies not being set after login in production
-- STATUS: Active debugging - login endpoint returns success but survivor_session cookie not set
-- IMPACT: Complete authentication failure - "sign in required" errors
-- FILES: /app/api/auth/login-user/route.ts, /lib/data/adapters/supabase.ts
-- NEXT: Check Vercel Function Logs for console output from login endpoint