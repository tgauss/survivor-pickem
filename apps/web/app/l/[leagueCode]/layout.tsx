import { LeagueSwitcher } from '@/components/LeagueSwitcher'

export default function LeagueLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { leagueCode: string }
}) {
  return (
    <div className="min-h-screen bg-charcoal-950">
      <div className="fixed top-4 right-4 z-50">
        <LeagueSwitcher currentLeagueCode={params.leagueCode} />
      </div>
      {children}
    </div>
  )
}