# NFL Survivor Pool

A mobile-first web application for managing multi-league NFL Survivor pools.

## Project Brief

See [CLAUDE.md](./CLAUDE.md) for the complete project specification and requirements.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Supabase (planned), currently using local in-memory adapter
- **Data Source**: SportsDataIO API (stubbed)

## Project Structure

```
.
├── apps/
│   └── web/              # Next.js application
│       ├── app/          # App Router pages
│       ├── components/   # UI components
│       └── lib/          # Business logic and utilities
├── packages/
│   └── sql/              # Database schema and policies
│       ├── migrations/   # SQL migration files
│       └── policies/     # Row-level security policies
└── CLAUDE.md            # Full project specification
```

## Core Features

### Authentication & Invites
- **Invite-only access**: Create leagues and generate invite tokens
- **Simple login**: Username + PIN authentication with rate limiting
- **Session management**: 90-day HTTP-only cookie sessions

### Week Picks
- **Team selection**: Pick one team to win each week from scheduled games
- **Duplicate warnings**: Hard warning when reusing a team (automatic loss)
- **Pick concealment**: Picks hidden until all alive submit or kickoff deadline
- **Live countdown**: Real-time countdown to next game kickoffs
- **Pick locks**: Submissions are final and locked after submit

### Pick Rules
- One pick per week per entry
- 2 losses = elimination
- Duplicate team use = automatic loss
- No pick = loss
- Tie games = loss
- Picks must be submitted before the last kickoff time of the week

### Scoring and Reveal
- **Game Results**: Admins mark winners for each game via the admin dashboard
- **Week Scoring**: Computes win/loss for each entry based on their pick vs actual results
- **All-Out Survive**: If every alive player loses, no strikes are given and the week is "rolled back"
- **Reveal Rules**: Picks are revealed when all alive submit OR last kickoff time passes
- **Force Reveal**: Admins can manually reveal with a logged reason
- **Strike System**: 2 strikes = elimination, duplicate teams = automatic loss

### Pages
- **`/`** - Leaderboard with pot, submission status, pick distribution (after reveal), live polling
- **`/week/[n]`** - Pick interface with game cards, countdown, and duplicate warnings
- **`/login`** - Username/PIN login form
- **`/claim/[token]`** - Invite claim form with full registration
- **`/admin`** - League management, game results, week scoring, forced reveal controls
- **`/history`** - Prior weeks with full pick results and win/loss indicators
- **`/me`** - Personal profile with season timeline and remaining teams grid
- **`/profile`** - Edit profile settings, avatar upload, PIN reset
- **`/chat`** - Weekly chat threads with emoji reactions and spoiler protection

## Features

### Me
- **Season Timeline**: Visual timeline of all your picks with results and opponent info
- **Teams Grid**: Color-coded grid showing used vs. remaining teams
- **Strike Counter**: Visual indicators of current elimination status
- **Quick Navigation**: Links to edit profile and league actions

### Profile
- **Identity Management**: Real name, username (locked), display name (locked)  
- **Contact Info**: Email and phone for notifications (informational only)
- **PIN Reset**: Secure 4-digit PIN change with confirmation
- **Avatar Upload**: Profile photo with live preview

### History
- **Week Browser**: Navigate through completed weeks with status indicators
- **Alive/Eliminated Sections**: Organized display with sticky headers
- **Pick Results**: Team picks with win/loss indicators when revealed
- **Filtering**: View all entries, survivors only, or eliminated only

### Chat
- **Weekly Threads**: One chat room per week with contextual messaging
- **Spoiler Protection**: Auto-detection and hiding of team names before reveal
- **Emoji Reactions**: 5 common reactions with 10-reaction limit per message
- **Real-time Updates**: 5-second polling for live conversation
- **Character Limits**: 500 character messages with validation

## Development

The app currently runs with a local in-memory data adapter. To switch to Supabase:

1. Set `USE_SUPABASE=true` in `.env.local`
2. Add your Supabase project credentials
3. Run the SQL migrations in `packages/sql/migrations/`
4. Apply RLS policies from `packages/sql/policies/`

## Test Credentials

When running locally, use these test accounts:
- `jsmith` / `1234`
- `sarahc` / `5678` 
- `mikej` / `9999`