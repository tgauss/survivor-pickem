-- Row Level Security (RLS) Policies for Supabase
-- Note: Service role bypasses all RLS policies by default
-- These policies are stubs for future browser-based writes

-- Enable RLS on all tables
alter table public.leagues enable row level security;
alter table public.invites enable row level security;
alter table public.entries enable row level security;
alter table public.sessions enable row level security;
alter table public.weeks enable row level security;
alter table public.games enable row level security;
alter table public.picks enable row level security;
alter table public.teams enable row level security;

-- Leagues: Read-only for all authenticated users
-- Future: Allow league admins to update their leagues
create policy "Leagues are viewable by all" 
  on public.leagues for select 
  using (true);

-- Invites: Read by token, write by league admin
-- Future: Check if user is league admin
create policy "Invites viewable by token" 
  on public.invites for select 
  using (true);

-- Entries: Read own entry, league admin can read all
-- Future: Implement proper entry ownership checks
create policy "Entries viewable by owner" 
  on public.entries for select 
  using (true);

-- Sessions: Only own session access
-- Future: Match session token to authenticated user
create policy "Sessions viewable by owner" 
  on public.sessions for select 
  using (true);

-- Weeks: Read-only for league members
-- Future: Check league membership
create policy "Weeks viewable by league members" 
  on public.weeks for select 
  using (true);

-- Games: Read-only for league members
-- Future: Check league membership via week
create policy "Games viewable by league members" 
  on public.games for select 
  using (true);

-- Picks: Read own picks or after reveal
-- Future: Check entry ownership and concealment status
create policy "Picks viewable by owner or after reveal" 
  on public.picks for select 
  using (true);

-- Teams: Read-only for all
create policy "Teams viewable by all" 
  on public.teams for select 
  using (true);

-- Comments for future implementation:
-- 1. Browser writes will require proper user authentication via Supabase Auth
-- 2. Each policy should check authenticated user's entry_id or league membership
-- 3. Admin operations should verify league admin status
-- 4. Concealment logic should be enforced in RLS policies
-- 5. Consider using security definer functions for complex operations