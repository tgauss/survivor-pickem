import { LeagueSwitcher } from '@/components/LeagueSwitcher'
import { LeagueTracker } from '@/components/LeagueTracker'

export default function LeagueLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { leagueCode: string }
}) {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <LeagueTracker leagueCode={params.leagueCode} />
      <div className="fixed top-4 right-4 z-50">
        <LeagueSwitcher currentLeagueCode={params.leagueCode} />
      </div>
      {children}
    </div>
  )
}