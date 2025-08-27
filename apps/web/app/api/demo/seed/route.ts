import { NextResponse } from 'next/server'
import { listLeagues, createLeague, createInvite, claimInvite, login, savePick, scoreWeek, revealIfReady, forceRevealWeek } from '@/lib/data'
import { getTeamsMap } from '@/lib/teams'
import { now, setFixedNow } from '@/lib/timectl'

function isoPlus(minutes: number) {
  return new Date(now() + minutes*60*1000).toISOString()
}

export async function POST() {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Dev-only' }, { status: 403 })
  }

  // Create or reuse a league
  const buyInCents = 2500
  const league = await (async () => {
    const leagues = await listLeagues()
    const found = leagues.find((l: any) => l.league_code === 'GL25')
    if (found) {
      return found
    }
    return await createLeague({
      name: 'G League 2025',
      season_year: 2025,
      buy_in_cents: buyInCents
    })
  })()

  const leagueId = league.id
  const leagueCode = league.league_code ?? 'GL25'

  // Seed 4 users
  const users = [
    { username: 'taylor',  display_name: 'TAYLOR',  real_name: 'Taylor G',  pin: '1111', email: 'taylor@example.com' },
    { username: 'amanda',  display_name: 'AMANDA',  real_name: 'Amanda G',  pin: '2222', email: 'amanda@example.com' },
    { username: 'olivia',  display_name: 'OLIVIA',  real_name: 'Olivia G',  pin: '3333', email: 'olivia@example.com' },
    { username: 'mabel',   display_name: 'MABEL',   real_name: 'Mabel G',   pin: '4444', email: 'mabel@example.com' },
  ]

  const entries:any[] = []
  for (const u of users) {
    // Create invite and claim
    const invite = await createInvite(leagueId)
    const result = await claimInvite(invite.token, {
      username: u.username,
      display_name: u.display_name,
      real_name: u.real_name,
      email: u.email,
      phone: '',
      pin: u.pin,
      avatar_url: null
    })
    if ('error' in result) {
      continue // Skip if user already exists
    }
    entries.push({ ...u, entryId: result.entry.id })
    // Create session
    await login(u.username, u.pin)
  }

  // Build Weeks 1–3 with picks
  const T = getTeamsMap()
  const pick = (abbr:string) => abbr in T ? abbr : 'SF'

  // Save picks:
  // W1: Taylor=SF win, Amanda=SEA loss, Olivia=PHI win, Mabel=no pick (tests no-pick loss)
  if (entries[0]) await savePick({ entryId: entries[0].entryId, leagueId, weekNo: 1, teamAbbr: pick('SF') })
  if (entries[1]) await savePick({ entryId: entries[1].entryId, leagueId, weekNo: 1, teamAbbr: pick('SEA') })
  if (entries[2]) await savePick({ entryId: entries[2].entryId, leagueId, weekNo: 1, teamAbbr: pick('PHI') })
  // Mabel no pick

  // W2: everyone picks teams that will "lose" to trigger all-out survive
  if (entries[0]) await savePick({ entryId: entries[0].entryId, leagueId, weekNo: 2, teamAbbr: pick('KC') })
  if (entries[1]) await savePick({ entryId: entries[1].entryId, leagueId, weekNo: 2, teamAbbr: pick('LV') })
  if (entries[2]) await savePick({ entryId: entries[2].entryId, leagueId, weekNo: 2, teamAbbr: pick('BUF') })
  if (entries[3]) await savePick({ entryId: entries[3].entryId, leagueId, weekNo: 2, teamAbbr: pick('MIA') })

  // W3: set up a duplicate pick for Taylor to show duplicate loss
  if (entries[0]) await savePick({ entryId: entries[0].entryId, leagueId, weekNo: 3, teamAbbr: pick('SF') }) // duplicate intended
  if (entries[1]) await savePick({ entryId: entries[1].entryId, leagueId, weekNo: 3, teamAbbr: pick('GB') })
  if (entries[2]) await savePick({ entryId: entries[2].entryId, leagueId, weekNo: 3, teamAbbr: pick('CHI') })
  if (entries[3]) await savePick({ entryId: entries[3].entryId, leagueId, weekNo: 3, teamAbbr: pick('SEA') })

  // Score and reveal W1 
  try {
    await scoreWeek({ leagueId, weekNo: 1 })
    await forceRevealWeek({ leagueId, weekNo: 1, reason: 'Demo setup' })
  } catch (e) {
    // Continue if scoring fails
  }

  // Score W2 (should trigger all-out survive)
  try {
    await scoreWeek({ leagueId, weekNo: 2 })
    await forceRevealWeek({ leagueId, weekNo: 2, reason: 'Demo setup' })
  } catch (e) {
    // Continue if scoring fails
  }

  // Week 3 left concealed with picks locked

  // Return demo info
  const base = `/l/${leagueCode}`
  return NextResponse.json({
    ok: true,
    league: { leagueId, leagueCode, name: 'G League 2025', buyInCents },
    routes: {
      league: base,
      leaderboard: base,
      week1: `${base}/week/1`,
      week2: `${base}/week/2`,
      week3: `${base}/week/3`,
      me: `${base}/me`,
      admin: `${base}/admin`,
      login: `/login`,
    },
    users: users.map(u => ({ username: u.username, pin: u.pin, display_name: u.display_name })),
    notes: [
      'Week 1 is revealed and scored with mixed results.',
      'Week 2 attempts all-out survive if everyone loses.',
      'Week 3 is concealed to show pre-reveal state.',
      'Branding is enabled via TEAM_BRANDING_MODE=private.'
    ]
  })
}