import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getStudentRoadmap, getWeeklyEffort, getSmartRecommendations } from './actions'
import { SkillRoadmap } from '@/components/dashboard/SkillRoadmap'
import { EffortChart } from '@/components/dashboard/EffortChart'
import { AIAdvisor } from '@/components/dashboard/AIAdvisor'
import { signout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the student roadmap data
  const roadmapData = await getStudentRoadmap()

  if (!roadmapData) {
    // User hasn't selected a domain
    redirect('/onboarding')
  }

  // Fetch weekly effort data
  const weeklyEffortResult = await getWeeklyEffort()
  const effortData = weeklyEffortResult.data || []

  // Fetch smart recommendations
  const recommendationsResult = await getSmartRecommendations()
  const recs = recommendationsResult.recommendations || []

  const { domain } = roadmapData

  return (
    <div className="min-h-screen bg-gray-50/50 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{domain.name} Track</h1>
          <p className="text-muted-foreground">AI-Optimized Learning Path</p>
        </div>
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>

      {/* Top Row: Analytics & Advisor */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          {/* The Recharts Component */}
          <EffortChart data={effortData} />
        </div>
        <div className="col-span-3">
          {/* The AI Advisor Component */}
          <AIAdvisor recommendations={recs} />
        </div>
      </div>

      {/* Bottom Row: The Roadmap */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Curriculum Graph</h2>
        <SkillRoadmap roadmapData={roadmapData} />
      </div>
    </div>
  )
}
