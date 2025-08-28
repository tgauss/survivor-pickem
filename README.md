# NFL Survivor Pool Platform

## 🏈 Overview

A comprehensive multi-league NFL Survivor Pool platform built with Next.js, TypeScript, and Supabase. The platform allows users to create and manage multiple survivor pools, make weekly picks, track standings, and simulate seasons for testing.

**Live URL**: https://www.pickemparty.app

## 📋 Table of Contents

- [Platform Features](#platform-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Database Schema](#database-schema)
- [Current Issues](#current-issues)
- [Developer Handoff Guide](#developer-handoff-guide)
- [Claude AI Continuation Guide](#claude-ai-continuation-guide)

## 🎯 Platform Features

### Core Features (Completed)
- ✅ **Multi-League Support**: Users can participate in multiple survivor pools
- ✅ **User Authentication**: User-based login system with session management
- ✅ **League Management**: Create leagues, generate invite codes, manage members
- ✅ **Weekly Pick System**: Submit picks for each week with team restrictions
- ✅ **Leaderboard & Standings**: Real-time standings with elimination tracking
- ✅ **Week Navigation**: Navigate between weeks to view games and make picks
- ✅ **Pot Tracking**: Automatic pot calculation ($25 per entry)
- ✅ **Admin Controls**: Super admin capabilities for league management
- ✅ **Season Simulation**: Tools to simulate games for testing

### Recent Additions
- ✅ Week navigation UI with current week indicator
- ✅ Past week results viewer
- ✅ Pick selection interface
- ✅ Week simulation controls for testing
- ✅ League switcher component

### Planned Features
- ⏳ Payment integration
- ⏳ Email notifications
- ⏳ Mobile app
- ⏳ Advanced statistics and analytics
- ⏳ Playoff bracket system

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14.2.32 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library in `/components`
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom session-based auth
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime (optional)

### Infrastructure
- **Hosting**: Vercel
- **Domain**: pickemparty.app
- **Environment**: Production + Development

## 📁 Project Structure

```
/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── admin/           # Admin endpoints
│   │   ├── weeks/           # Week-related endpoints
│   │   ├── picks/           # Pick submission
│   │   ├── me/              # User-specific endpoints
│   │   └── debug/           # Debug endpoints
│   ├── l/[leagueCode]/      # League-specific pages
│   │   ├── week/[n]/        # Week view pages
│   │   ├── admin/           # Admin panel
│   │   └── me/              # User profile
│   ├── login/               # Login page
│   └── leagues/             # League selector
├── components/              # React components
│   ├── ui/                 # UI components
│   ├── brand/              # Branding components
│   ├── WeekNavigation.tsx  # Week navigation
│   ├── WeekSimulator.tsx   # Simulation controls
│   └── LeagueSwitcher.tsx  # League switcher
├── lib/                     # Library code
│   ├── data/               # Data layer
│   │   ├── adapters/       # Database adapters
│   │   │   ├── supabase.ts # Supabase adapter
│   │   │   └── local.ts    # Local testing adapter
│   │   └── types.ts        # TypeScript types
│   ├── auth/               # Authentication
│   │   └── sessions.ts     # Session management
│   └── supabase/           # Supabase clients
│       ├── client.ts       # Browser client
│       └── server.ts       # Server client
└── public/                 # Static assets
    └── team-logos/         # NFL team logos
```

## 🔐 Environment Setup

### Required Environment Variables

Create a `.env.local` file for development:

```env
# Data adapter mode
USE_SUPABASE=true

# Supabase Configuration
SUPABASE_URL=https://bnhmkyliothxmuzvqato.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# SportsDataIO API (optional)
SPORTSDATAIO_API_KEY=your_api_key_here

# Session Configuration
SESSION_COOKIE_NAME=survivor_session
SESSION_SECRET=your_secret_here

# Admin Configuration
SUPER_ADMIN_USERNAME=tgauss
SUPER_ADMIN_PIN=3112

# Team Branding
TEAM_BRANDING_MODE=private
```

### Vercel Production Variables

See `.env.vercel` or `VERCEL_ENV_VARIABLES.txt` for production environment variables.

## 💾 Database Schema

### Core Tables

#### users
```sql
- id: uuid (PK)
- username: text (unique)
- pin_hash: text
- first_name: text
- last_name: text
- email: text
- phone: text
- role: text ('player', 'admin', 'super_admin')
- avatar_url: text
- created_at: timestamp
- updated_at: timestamp
```

#### leagues
```sql
- id: uuid (PK)
- league_code: text (unique)
- name: text
- season_year: integer
- buy_in_cents: integer
- created_at: timestamp
- updated_at: timestamp
```

#### entries
```sql
- id: uuid (PK)
- league_id: uuid (FK -> leagues)
- user_id: uuid (FK -> users)
- display_name: text
- username: text
- pin_hash: text
- strikes: integer
- is_alive: boolean
- paid: boolean
- created_at: timestamp
- updated_at: timestamp
```

#### picks
```sql
- id: uuid (PK)
- entry_id: uuid (FK -> entries)
- week_id: uuid (FK -> weeks)
- team_id: uuid (FK -> teams)
- submitted_at: timestamp
- is_correct: boolean
```

#### sessions
```sql
- id: uuid (PK)
- user_id: uuid (FK -> users)
- session_token: text (unique)
- expires_at: timestamp
- created_at: timestamp
```

#### teams
```sql
- id: uuid (PK)
- abbr: text (unique)
- city: text
- name: text
- logo_url: text
```

#### games
```sql
- id: uuid (PK)
- week_id: uuid (FK -> weeks)
- home_team_id: uuid (FK -> teams)
- away_team_id: uuid (FK -> teams)
- winner_team_id: uuid (FK -> teams)
- status: text
- kickoff: timestamp
```

## 🐛 Current Issues

### 🔴 Critical Issue: Session Cookie Not Being Set in Production

**Status**: ACTIVE DEBUGGING (as of Aug 28, 2025)

**Problem**: 
- Users can successfully authenticate, but the `survivor_session` cookie is not being set in production
- This causes "sign in required" errors on every navigation
- Test cookies CAN be set successfully, indicating the issue is specific to the login flow

**Debugging Progress**:
1. ✅ Verified cookies can be set in production (test endpoint works)
2. ✅ Confirmed login endpoint returns success response
3. ✅ Added comprehensive logging to login endpoint
4. ❌ Session cookie still not being set after login

**Next Steps**:
1. Check Vercel Function Logs for console output
2. Verify `loginUser` function is returning sessionToken
3. Check if Supabase connection is working in production

**Related Files**:
- `/app/api/auth/login-user/route.ts` - Login endpoint
- `/lib/data/adapters/supabase.ts` - loginUser function
- `/lib/auth/sessions.ts` - Session management

### Other Known Issues
- Week 0 references have been fixed but may need testing
- Some API endpoints may still use old entry-based auth (being migrated)

## 👨‍💻 Developer Handoff Guide

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/tgauss/survivor-pickem.git
   cd survivor-pickem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials

4. **Run development server**
   ```bash
   npm run dev
   ```

### Key Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Testing Credentials

- Username: `taylor` / PIN: `1234` (Super Admin)
- Username: `jsmith` / PIN: `1234` (Regular User)
- Username: `brandon` / PIN: `1234` (Regular User)

### Debugging Endpoints

- `/api/debug/env` - Check environment variables
- `/api/debug/cookies` - Check current cookies
- `/api/debug/set-session` - Test session cookie setting
- `/api/debug/login-test` - Test cookie setting capability

### Common Tasks

#### Adding a New API Endpoint
1. Create file in `/app/api/[path]/route.ts`
2. Use `readUserSessionCookie()` for auth
3. Add `credentials: 'same-origin'` to client fetch calls

#### Modifying Database Schema
1. Update Supabase schema
2. Update types in `/lib/data/types.ts`
3. Update adapter functions in `/lib/data/adapters/supabase.ts`

#### Deploying to Production
1. Push to main branch
2. Vercel auto-deploys
3. Check Vercel dashboard for build status

## 🤖 Claude AI Continuation Guide

### For Claude to Continue This Project

**Context**: You are working on a NFL Survivor Pool platform that is mostly complete but has a critical authentication issue in production.

**Current Task**: Fix the session cookie not being set after login in production.

**Key Files to Review First**:
1. `/app/api/auth/login-user/route.ts` - The login endpoint with debugging
2. `/lib/data/adapters/supabase.ts` - Contains loginUser function
3. `/lib/auth/sessions.ts` - Session management utilities
4. This README for full context

**Testing Approach**:
1. Use debug endpoints to verify cookie capabilities
2. Check Vercel logs for console output
3. Test locally first with: `npm run dev`
4. Deploy with: `git push origin main`

**Important Context**:
- The platform uses user-based authentication (not entry-based)
- Cookies work in test endpoints but not in login
- All client fetch calls need `credentials: 'same-origin'`
- The database is Supabase project: `bnhmkyliothxmuzvqato`

**Next Debugging Steps**:
1. Check if `loginUser` is throwing an error
2. Verify sessionToken is being generated
3. Check Supabase connection in production
4. Review Network tab for Set-Cookie headers

### Environment Variables Needed

Make sure these are set in Vercel:
- All variables from `VERCEL_ENV_VARIABLES.txt`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is the actual service role key, not anon key

### Contact & Support

- **Repository**: https://github.com/tgauss/survivor-pickem
- **Live Site**: https://www.pickemparty.app
- **Supabase Project**: https://supabase.com/dashboard/project/bnhmkyliothxmuzvqato

## 📅 Development Timeline

### Phase 1: Core Platform (Completed)
- Basic league and entry management
- Pick submission system
- Leaderboard functionality

### Phase 2: User Migration (Completed)
- Migrated from entry-based to user-based auth
- Added user registration and login
- Updated all endpoints for new auth system

### Phase 3: Enhanced Features (Completed)
- Week navigation UI
- Season simulation tools
- League switching
- Pot tracking

### Phase 4: Production Issues (Current)
- Fixing session persistence
- Debugging cookie issues
- Stabilizing authentication

### Phase 5: Future Enhancements (Planned)
- Payment integration
- Email notifications
- Advanced analytics
- Mobile application

## 📝 Notes

- The platform supports both Supabase and local adapters for flexibility
- Team logos are stored locally in `/public/team-logos/`
- The system uses plain text PINs for testing (should be hashed in production)
- Real-time updates are optional and use Supabase Realtime when enabled

---

**Last Updated**: August 28, 2025
**Version**: 1.0.0-beta
**Status**: Production with active debugging