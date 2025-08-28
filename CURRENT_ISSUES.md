# Current Issues & Debugging Status

## 🔴 CRITICAL: Session Cookie Not Being Set (Active)

### Issue Summary
After successful login, the `survivor_session` cookie is not being set in the browser, causing users to see "sign in required" errors on all subsequent requests.

### Current Status
- **Discovered**: August 28, 2025
- **Status**: Active debugging with comprehensive logging added
- **Impact**: Complete authentication failure in production
- **Workaround**: None - platform unusable

### Debugging Progress

#### ✅ Confirmed Working
1. **Test Cookie Setting**: `/api/debug/set-session` successfully sets survivor_session cookie
2. **Cookie Infrastructure**: Browser accepts and stores cookies from the domain
3. **Login Response**: Login API returns 200 success with user data
4. **Local Development**: Authentication works perfectly locally

#### ❌ Still Failing
1. **Production Login**: survivor_session cookie not set after login
2. **Session Persistence**: All navigation requires re-authentication

### Technical Details

#### Test Results
```json
// Before login
{
  "hasSessionCookie": false,
  "sessionCookieValue": "none",
  "allCookieNames": ["last_league_code"],
  "cookieCount": 1
}

// After visiting /api/debug/set-session
{
  "hasSessionCookie": true,
  "sessionCookieValue": "test-sessi...",
  "allCookieNames": ["survivor_session"],
  "cookieCount": 1
}

// After actual login attempt  
{
  "hasSessionCookie": false,
  "sessionCookieValue": "none",
  "allCookieNames": ["last_league_code"],
  "cookieCount": 1
}
```

#### Code Changes Made
1. **Login Endpoint** (`/app/api/auth/login-user/route.ts`):
   - Added comprehensive error handling
   - Added detailed logging
   - Set cookie via `response.cookies.set()`
   - Added `credentials: 'include'` to fetch request

2. **Client Requests**:
   - Added `credentials: 'same-origin'` to all fetch calls
   - Updated login form to include credentials

### Current Investigation

#### Hypothesis
The `loginUser` function may be:
1. Throwing an error before cookie setting
2. Not returning a sessionToken
3. Failing silently due to Supabase connection issues

#### Next Steps for Debugging
1. **Check Vercel Function Logs**:
   - Look for console.log output from login endpoint
   - Identify where the flow is breaking

2. **Verify Database Connection**:
   - Test if Supabase queries are working in production
   - Check environment variables are loaded correctly

3. **Network Analysis**:
   - Inspect Set-Cookie headers in browser DevTools
   - Compare successful test endpoint vs failing login endpoint

### Code References

#### Key Files
- `/app/api/auth/login-user/route.ts` - Main login endpoint
- `/lib/data/adapters/supabase.ts` - Contains `loginUser` function  
- `/app/login/page.tsx` - Frontend login form

#### Debug Endpoints
- `/api/debug/cookies` - Check current cookies
- `/api/debug/set-session` - Test session cookie setting
- `/api/debug/env` - Verify environment variables

### Environment Requirements
All production environment variables are confirmed set in Vercel:
```
USE_SUPABASE=true
SUPABASE_URL=https://bnhmkyliothxmuzvqato.supabase.co
SUPABASE_ANON_KEY=[confirmed present]
SUPABASE_SERVICE_ROLE_KEY=[confirmed present]
[...other vars confirmed]
```

---

## 🟡 Minor Issues

### API Endpoint Migration
**Status**: Ongoing
- Some endpoints may still use `readSessionCookie()` instead of `readUserSessionCookie()`
- Most critical endpoints have been updated
- **Impact**: Minimal - specific features may fail

### Week 0 References  
**Status**: Fixed but untested
- Previously hardcoded `weekNo=0` causing 400 errors
- Updated to use `weekNo=1` 
- **Impact**: Resolved

---

## 🔧 Recently Fixed

### Client-Side Cookie Handling
- Added `credentials: 'same-origin'` to all fetch requests
- Fixed LeagueSwitcher, WeekSimulator, and other components

### API Parameter Handling
- Updated endpoints to accept `leagueCode` instead of just `leagueId`
- Added proper league resolution in API routes

### Authentication Flow Migration
- Completed migration from entry-based to user-based authentication
- Updated session data structures across components

---

**Last Updated**: August 28, 2025