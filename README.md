# Survivor Pickem Web App

A Next.js application for NFL survivor pool management with SportsDataIO integration.

## Features

- **League Management**: Create and manage survivor leagues with customizable buy-ins
- **Real-time Data**: Integration with SportsDataIO for live NFL scores and schedules
- **Admin Dashboard**: Comprehensive admin interface for league and game management
- **Survivor Rules**: Classic survivor pool gameplay with all-out survive protection
- **User Interface**: Modern, responsive design with dark theme

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SportsDataIO API key (optional for development)

### Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```bash
# SportsDataIO API Configuration
SPORTSDATA_API_KEY=your_api_key_here
SPORTSDATA_BASE_URL=https://api.sportsdata.io/v3/nfl
SPORTSDATA_USE_QUERY_KEY=false

# Other environment variables...
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Team Data Management

The application uses static team data as the canonical source for NFL team information, branding, and metadata. This ensures consistent team colors, logos, and styling throughout the application.

### Static Teams Data

Team data is loaded from the static JSON file at the repository root:
- **Source File**: `NFL Team Info.json` 
- **Teams Count**: 32 NFL teams with complete metadata
- **Fields**: TeamID, Key (abbreviation), City, Name, FullName, Colors, LogoURL, WordMarkURL

### Team Loader (`lib/teams.ts`)

The teams loader provides a type-safe interface for accessing team data:

```typescript
import { getTeamByAbbr, requireTeamByAbbr, getTeamsArray } from '@/lib/teams'

// Get team by abbreviation (returns undefined if not found)
const chiefs = getTeamByAbbr('KC')

// Require team by abbreviation (throws if not found)  
const chiefs = requireTeamByAbbr('KC')

// Get all teams as array
const allTeams = getTeamsArray()
```

**Features:**
- Hex color normalization (ensures #RRGGBB format)
- Type-safe team lookup helpers
- Validation and error handling
- Consistent team abbreviations constant

### Team Branding Integration

Team branding is automatically applied throughout the UI:

**Components with Branding:**
- `TeamsGrid`: Shows team logos, colors, and gradients
- `GameCard`: Team-colored buttons with logos and branding
- API responses enriched with team metadata

**Team Enrichment (`lib/team-enricher.ts`):**
```typescript
import { enrichGame, enrichTeam } from '@/lib/team-enricher'

// Enrich basic team data with full branding
const enrichedTeam = enrichTeam(basicTeam)
// Returns: primaryColor, secondaryColor, fullName, wordMarkUrl, etc.
```

### Admin Team Management

Administrators can seed/update team data in the database:

**Seed Teams API**: `POST /api/admin/teams/seed`
- Updates both local and Supabase adapters
- Replaces existing team data with static JSON
- Maintains referential integrity with games and schedules

**Usage:**
```bash
curl -X POST http://localhost:3000/api/admin/teams/seed
```

### Data Adapter Integration

Both data adapters support static teams seeding:

**Local Adapter**: Seeds in-memory teams array
**Supabase Adapter**: Upserts teams table with static data

The schedule import functions automatically reference seeded teams by abbreviation, ensuring consistency between team metadata and game data.

### Testing

Comprehensive test coverage includes:
```bash
# Run teams loader tests
npm test lib/__tests__/teams.test.ts

# Run team enricher tests  
npm test lib/__tests__/team-enricher.test.ts

# Run branding component tests
npm test __tests__/PickBadge.snapshot.test.tsx

# Run color utility tests
npm test __tests__/color.util.test.ts

# Run API branding tests
npm test __tests__/branding.payload.test.ts
```

**Test Coverage:**
- Static data validation (32 teams, valid URLs, colors)
- Team lookup functions (by abbreviation, error handling)  
- Team enrichment (branding injection, type safety)
- Data consistency across functions
- Branding component snapshots and accessibility
- Color utility functions and contrast calculations
- API payload enrichment verification

## Team Branding

The application provides configurable team branding that respects user preferences and accessibility requirements.

### Configuration

Control team branding display via environment variable:

```bash
# .env.local
TEAM_BRANDING_MODE=neutral   # neutral | private
```

**Modes:**
- `neutral`: Clean, consistent UI without team colors or logos
- `private`: Full team branding with colors, logos, and styling

### Branding Components

**Core Components:**
- `TeamLogo`: Displays team logo (private mode) or abbreviation monogram (neutral mode)
- `TeamBrand`: Provides CSS custom properties for team colors and text contrast
- `PickBadge`: Shows team selection with branding and animations
- `TeamStack`: Groups multiple picks by team in collapsible sections

**Usage Example:**
```tsx
import { PickBadge, TeamBrand, TeamLogo } from '@/components/brand'

// Show user's pick with team branding
<PickBadge abbr="KC" label="YOU" />

// Custom branded component
<TeamBrand abbr="KC">
  <div style={{ backgroundColor: 'var(--team-primary)' }}>
    <TeamLogo abbr="KC" size={24} />
  </div>
</TeamBrand>
```

### UI Integration

**Leaderboard Page:**
- After reveal: Pick badges replace generic team abbreviations
- Pick stacks: Collapsible sections group entries by team choice
- Fade-in animations with staggered timing for entry cards

**Week Selection Page:**
- Team-colored buttons in game selection (respecting branding mode)
- Diagonal stripe overlay for previously used teams
- Pulse animation on successful pick submission

**Distribution Charts:**
- Team logos in legend (private mode) or abbreviation pills (neutral mode)
- Color-coded charts use team branding or neutral palette

### Accessibility

**Color Contrast:**
- Automatic text color calculation using luminance-based contrast ratios
- Always meets WCAG AA standards for readability
- Fallback to neutral colors when team colors have poor contrast

**Motion Respect:**
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled, instant transitions */
}
```

**Keyboard Navigation:**
- All branded components maintain focus indicators
- Team logos include proper alt text and ARIA labels

### Performance

**Optimizations:**
- Team data cached in memory after initial load
- CSS custom properties avoid re-renders for color changes
- Animations use transform/opacity for hardware acceleration
- Static team JSON eliminates runtime API calls

**Bundle Impact:**
- Team branding adds ~15KB to bundle (compressed)
- Tree-shaking removes unused animation classes
- Lazy loading for team logos in private mode

## SportsDataIO Integration

This application integrates with SportsDataIO to provide real-time NFL schedules and game results. **Note: Team data is sourced from static JSON, not SportsDataIO.**

### Supported Endpoints

- **Current Timeframe**: `/Timeframes/current` - Current season/week information  
- **Schedules**: `/Schedules/{seasonCode}` - Game schedules for regular and postseason
- **Basic Scores**: `/ScoresBasic/{seasonCode}/{week}` - Live game scores and status
- **Final Scores**: `/ScoresByWeekFinal/{seasonCode}/{week}` - Final game results

### Configuration

The SportsDataIO service supports both header-based and query parameter authentication:

- **Header Authentication** (default): Uses `Ocp-Apim-Subscription-Key` header
- **Query Parameter**: Set `SPORTSDATA_USE_QUERY_KEY=true` to use `?key=` parameter

### Mock Data

When `SPORTSDATA_API_KEY` is not configured, the service automatically falls back to mock data for development:

- 32 NFL teams with logos and abbreviations
- Sample regular season and playoff schedules
- Example game scores and statuses
- Current timeframe data

### Admin Features

The admin dashboard provides SportsDataIO integration controls:

#### Import Schedule  
Imports complete season schedules (regular season + playoffs) for the selected league's season year.

#### Sync Results
Synchronizes game results for a specific week, automatically triggering survivor pool scoring when games are final.

### Playoff Week Mapping

SportsDataIO playoff weeks are mapped to internal phase system:
- Week 1 → `wild_card` 
- Week 2 → `divisional`
- Week 3 → `conference`
- Week 4 → Super Bowl (not used in survivor pools)

### API Integration Functions

Two main integration functions handle data synchronization:

#### `importScheduleFromSportsDataIO(seasonCode, games)`
Creates weeks and games from SportsDataIO schedule data, with automatic playoff phase mapping.

#### `syncResultsFromSportsDataIO(seasonCode, week, finalScores, basicScores?)`
Updates game results and triggers automatic week scoring when final scores are available. Returns sync statistics including all-out survive detection.

### Error Handling

The SportsDataIO service includes robust error handling:

- **Rate Limiting**: Automatic retry with exponential backoff for 429 errors
- **Server Errors**: Retry logic for 5xx responses  
- **Network Issues**: Graceful fallback to mock data
- **Validation**: Zod schema validation for all API responses

### Testing

Comprehensive test coverage includes:

```bash
# Run SportsDataIO service tests
npm test lib/services/__tests__/sportsdataio.test.ts

# Run local adapter integration tests  
npm test lib/data/adapters/__tests__/local-sportsdata.test.ts

# Run API route tests
npm test app/api/admin/sportsdata/__tests__/routes.test.ts
```

## Development

### Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/admin/sportsdata/  # SportsDataIO API routes
│   └── admin/              # Admin dashboard
├── lib/
│   ├── services/           # External service clients
│   │   ├── sportsdataio.ts    # SportsDataIO integration
│   │   └── __mocks__/         # Mock data for development
│   ├── data/adapters/      # Data layer adapters
│   └── config.ts           # Configuration management
└── components/             # React components
```

### Adding New SportsDataIO Endpoints

1. Add Zod schema for response validation
2. Implement service function with retry logic
3. Add corresponding mock data
4. Create integration function in local adapter
5. Add admin API route if needed
6. Update admin UI with new functionality
7. Write comprehensive tests

## League-scoped URLs

The application uses league-scoped URLs to support multiple leagues within a single deployment. All user and admin pages are scoped to a specific league using the pattern `/l/[leagueCode]/...`.

### URL Structure

- **Leaderboard**: `/l/2024-survivor` 
- **Make Pick**: `/l/2024-survivor/week/1`
- **Profile**: `/l/2024-survivor/me`
- **History**: `/l/2024-survivor/history` 
- **Admin**: `/l/2024-survivor/admin`
- **Claim Invite**: `/l/2024-survivor/claim/ABC123`

### League Codes

League codes are generated from the league name and season year:
- `2024-nfl-survivor` → "NFL Survivor" league for 2024 season
- `2024-family-pool` → "Family Pool" league for 2024 season

Explicit league codes can also be set via the `league_code` field.

### Legacy Route Handling

Legacy routes automatically redirect to league-scoped equivalents:
- `/` → `/l/[last-league]` or `/leagues` if no last league
- `/week/1` → `/l/[last-league]/week/1`
- `/admin` → `/l/[last-league]/admin`

The system uses a `last_league_code` cookie to remember the user's last visited league.

### League Switching

The header includes a league switcher dropdown allowing users to:
- Switch between available leagues
- View all leagues via `/leagues`  
- Persist their league choice via cookie

### API Integration

API routes support both `leagueCode` and `leagueId` parameters:
- `GET /api/leaderboard?leagueCode=2024-survivor&weekNo=1`
- `POST /api/picks` with `{ leagueCode: "2024-survivor", weekNo: 1, teamAbbr: "KC" }`

The league context resolver automatically handles:
- Query parameters (`?leagueCode=`)
- Request body (`{ leagueCode: "..." }`)
- Custom headers (`X-League-Code`)
- Cookie fallback (`last_league_code`)

## Switching to Supabase

The application supports both local (in-memory) and Supabase data adapters. By default, it uses the local adapter for development.

### Enabling Supabase

1. **Set Environment Variables**

   Update your `.env.local` file:
   ```bash
   USE_SUPABASE=true
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Apply Database Migrations**

   Using Supabase MCP or the SQL editor, apply migrations in order:
   ```sql
   -- Apply in sequence:
   -- 0001_initial_schema.sql
   -- 0002_weeks_phase.sql
   -- 0003_concealment_rollback.sql
   -- 0004_indexes.sql
   -- 0005_realtime_publication.sql
   ```

3. **Apply RLS Policies**

   Apply the RLS policies:
   ```sql
   -- packages/sql/policies/rls_supabase_base.sql
   ```

### Architecture Notes

- **Service Role Authentication**: All database writes use the service role key server-side
- **No Browser Writes**: The anon key is only used for realtime subscriptions
- **RLS Enabled**: Row Level Security is enabled with stub policies for future expansion
- **Realtime Updates**: Automatic UI updates when picks, games, or weeks change

### Realtime Features

When using Supabase, the application provides:

- **Live Leaderboard Updates**: See picks and results in real-time
- **Automatic Score Updates**: Results sync instantly when games finish  
- **Pick Notifications**: Watch as other players submit their picks
- **No Polling Required**: Replaces the 5-second polling with WebSocket subscriptions

### Data Adapter Switching

The adapter is chosen at runtime based on `USE_SUPABASE`:

- `false` (default): Uses local in-memory adapter
- `true`: Uses Supabase with PostgreSQL and realtime

The switching logic in `lib/data/index.ts` ensures:
- Tree-shaking removes unused adapter code
- Async imports load only the active adapter
- No Supabase dependencies when using local mode

### Admin Dashboard

The admin dashboard displays:
- Current data adapter (Local or Supabase)
- Realtime connection status (when using Supabase)
- All existing admin functions work with both adapters

## End-to-End Testing

The application includes comprehensive Playwright end-to-end tests that verify the complete Survivor flow.

### Running E2E Tests

```bash
# Install Playwright browsers (one-time setup)
npx playwright install --with-deps

# Run all E2E tests
npm run e2e

# Run specific test file
npx playwright test tests/e2e/01_invite_claim_login_pick.spec.ts

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

### Test Coverage

**Complete User Journey Tests:**
- `01_invite_claim_login_pick.spec.ts`: Full invite → claim → login → pick flow
- `02_reveal_and_score.spec.ts`: Week scoring, reveal, and pick badge display
- `03_all_out_survive_rollback.spec.ts`: All-out survive scenario with rollback behavior
- `04_duplicate_pick_warning.spec.ts`: Duplicate team pick validation and warnings
- `05_multi_league_switch.spec.ts`: Multi-league switching and data isolation

**Key Features Tested:**
- Hermetic test environment with no external dependencies
- Admin invite generation and claim flow
- Team selection with branding and duplicate warnings
- Week scoring and reveal mechanics
- All-out survive edge case handling
- League switching and URL routing

### Viewing Test Results

```bash
# Open latest HTML report
npx playwright show-report

# View specific trace file
npx playwright show-trace test-results/path/to/trace.zip
```

### Test-Only APIs

**Note:** Test-only API endpoints exist and only respond when `NODE_ENV==='test'`:
- `POST /api/test/reset` - Resets local adapter with deterministic data
- `POST /api/test/freeze-time` - Freezes time for consistent test behavior  
- `POST /api/test/make-week` - Creates weeks with predictable games

These endpoints are automatically blocked in production environments.

## Deployment

The application is built for deployment on platforms like Vercel, Netlify, or traditional hosting.

```bash
npm run build
npm start
```

Ensure all environment variables are configured in your deployment environment.# Force fresh deployment Wed Aug 27 21:07:21 PDT 2025
