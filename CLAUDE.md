# NFL Survivor Pool — Project Brief

## One-page summary
- Mobile-first web app for multi-league NFL Survivor.
- Tech: Next.js App Router, TypeScript, TailwindCSS.
- Data: Supabase planned later. Ship local JSON/in-memory adapter first.
- Source for schedule/results: SportsDataIO. Stub a typed service for now.
- Web only. No email or SMS sending.
- Simple, fun, quick. Clean, modern, masculine visual style.

## Core rules
- One entry per person per league.
- 2 losses = eliminated. Tie = loss. No pick = loss. Duplicate team = loss.
- Picks final after submit. Admin may delete a pick pre-kickoff to fix mistakes.
- Conceal picks until all alive submit or at last kickoff time of the week.
- If all alive lose, nobody is eliminated for that week.
- Season includes playoffs through Conference Championships. Exclude Super Bowl.
- If multiple alive after Conference Championships, weekly playoff tiebreaker:
  - Remaining players pick all games that week. Most correct advances.
  - If still tied when only Super Bowl remains, split the pot.

## Identity, auth, sessions
- Claim via one-time invite link scoped to league.
- Collect: username, display_name, real_name, email, phone, PIN, avatar.
- Login via username + PIN. HttpOnly cookie session, 90 days.
- Rate limit: lock username after 5 bad PIN attempts for 10 minutes.

## Admin and money
- No payments in-app. League has buy-in amount. Entry has opted_in and paid flags.
- Pot shows buy_in * opted_in count. Super admin marks paid.
- Admin cannot see picks unless they click "Reveal as Admin" with a required reason.
- Log admin peeks in `admin_view_events`.

## Time and chat
- All times shown in viewer's local timezone. Default relative display with quick toggle to absolute.
- Chat is basic text with emoji reactions. No threads.

## Pages
- Leaderboard: pot chip, phase/week, Submitted X/Y, status chips, skulls, week chips, live updates, pick distribution after reveal, confetti on survive and on league resolve.
- Week: game cards with logos, kickoff local time and countdown, USED labels, duplicate-pick warning modal, lock after submit.
- Me: timeline of picks and results, grid of remaining teams.
- History: prior weeks fully revealed, simple filters.
- Profile: view fields, PIN reset, avatar upload.
- Admin: invite links, paid toggles, CSV uploaders, SportsDataIO sync placeholder, Score Week, export CSV, "Reveal as Admin" with reason.

## Data model (public schema)
- leagues(id, name, season_year, league_code, buy_in_cents, display_timezone, include_playoffs=true, include_super_bowl=false, tiebreaker_mode='playoff_multi', created_at)
- league_admins(league_id, entry_id, unique)
- entries(id, league_id, username, display_name unique per league, real_name, email, phone, pin_hash, avatar_url, strikes, eliminated, opted_in, paid, paid_at, created_at)
- invites(id, league_id, entry_id?, token unique, claimed_by_entry?, created_at, claimed_at)
- sessions(id, entry_id, session_token unique, expires_at, created_at)
- teams(id, abbr unique, city, name, espn_team_id, logo_url)
- weeks(id, season_year, week_no, phase in regular|wild_card|divisional|conference, round_order, start_at, end_at, last_kickoff_at, revealed_at, unique(season_year, week_no) for regular)
- games(id, week_id, home_team, away_team, kickoff_at, neutral_site, status in scheduled|in_progress|final, winner_team, espn_game_id, created_at)
- picks(id, entry_id, week_id, game_id?, team_id?, submitted_at, locked default true, result in pending|win|loss|tie, unique(entry_id, week_id))
- playoff_tiebreaker_picks(id, league_id, entry_id, week_id, game_id, team_id, submitted_at, result in pending|win|loss|tie, unique(entry_id, game_id))
- messages(id, league_id, week_id, entry_id, body, is_spoiler, created_at)
- pick_audits(id, pick_id, entry_id, week_id, old_team_id, new_team_id, old_game_id, new_game_id, changed_at, changed_by, reason)
- results_sync_log(id, league_id, source, ran_at, status, summary)
- views: v_entry_used_teams, v_week_submission_progress, v_pick_distribution, v_leaderboard_entry_week

## First milestone scope (Definition of Done)
- Next.js app compiles and runs with a local in-memory adapter and a Week 0 seed with two fake games.
- Routes: /, /week/[n], /me, /history, /profile, /claim/[token], /admin.
- Leaderboard shows live polling (dev) with Submitted X/Y and conceal banner. After reveal, show picks and distribution.
- Week page prevents duplicate picks with a blocking modal. After submit, show "Pick saved. Locked for Week N."
- Admin can generate invites and score the week in local mode.
- No Supabase calls yet. Provide SQL migrations and RLS stubs as files only.
- README explains how to flip to Supabase later.

## Code shape to target next
- apps/web/ for Next.js app.
- apps/web/lib/data/adapters/local.ts for in-memory adapter.
- apps/web/lib/data/adapters/supabase.ts for later.
- apps/web/lib/services/sportsdataio.ts typed stubs only.
- packages/sql/migrations/0001_init.sql base schema.
- packages/sql/migrations/0002_playoffs_multi_league.sql additions.
- packages/sql/policies/rls_stubs.sql.
- .env.local.example with USE_SUPABASE=false and placeholders.

## Style
- Charcoal background, subtle elevation, strong type. Inter or SF. 8px radii. Motion kept light.
- Clear focus rings. Minimum 4.5:1 contrast. Tappable cards.

## Next step after this file (do not run now)
- Scaffold Next.js app and Tailwind.
- Add local data adapter, seed Week 0, and the Leaderboard page with polling.
- Add SQL files as plain files. Do not execute against Supabase yet.