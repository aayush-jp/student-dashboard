import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Target } from 'lucide-react'
import { SkillCard } from './SkillCard'
import type { RoadmapData, SkillWithProgress } from '@/types/roadmap'

interface ColumnHeaderProps {
  level: number
  title: string
  description: string
  count: number
  completedCount: number
}

function ColumnHeader({ level, title, description, count, completedCount }: ColumnHeaderProps) {
  const colors = {
    1: 'bg-zinc-900 text-white',
    2: 'bg-blue-600 text-white',
    3: 'bg-green-600 text-white',
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full ${colors[level as keyof typeof colors]} text-lg font-bold`}
        >
          {level}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-600">
          {completedCount} of {count} completed
        </span>
        {count > 0 && (
          <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden max-w-[100px]">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(completedCount / count) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ColumnConnector() {
  return (
    <div className="hidden lg:flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <ArrowRight className="h-8 w-8 text-zinc-400" />
        <div className="w-0.5 h-full bg-zinc-200 min-h-[200px]" />
      </div>
    </div>
  )
}

interface SkillRoadmapProps {
  roadmapData: RoadmapData
}

/**
 * Calculate if a skill is locked based on prerequisites.
 * A skill is locked if any of its prerequisites are not completed.
 */
function calculateIsLocked(
  skill: SkillWithProgress,
  allSkills: SkillWithProgress[]
): boolean {
  if (skill.prerequisites.length === 0) {
    return false // No prerequisites, not locked
  }

  // Create a map of skill ID -> status for quick lookup
  const skillStatusMap = new Map(allSkills.map((s) => [s.id, s.status]))

  // Check if all prerequisites are completed
  for (const prerequisiteId of skill.prerequisites) {
    const prerequisiteStatus = skillStatusMap.get(prerequisiteId)
    if (prerequisiteStatus !== 'completed') {
      return true // At least one prerequisite is not completed
    }
  }

  return false // All prerequisites are completed
}

export function SkillRoadmap({ roadmapData }: SkillRoadmapProps) {
  const { skills, stats } = roadmapData

  // Flatten all skills for dependency checking
  const allSkills = [
    ...skills.foundation,
    ...skills.core,
    ...skills.specialization,
  ]

  // Calculate completed count for each level
  const foundationCompleted = skills.foundation.filter((s) => s.status === 'completed').length
  const coreCompleted = skills.core.filter((s) => s.status === 'completed').length
  const specializationCompleted = skills.specialization.filter(
    (s) => s.status === 'completed'
  ).length

  // Check if there are any skills
  const hasSkills = stats.total > 0

  if (!hasSkills) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <Target className="h-16 w-16 text-zinc-400 mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-zinc-900">No Skills Yet</h3>
            <p className="text-zinc-600 mt-2">
              Skills for this domain are being prepared. Check back soon!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Roadmap Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-zinc-900">Your Learning Roadmap</h2>
        <p className="text-zinc-600">
          Follow the path from foundation to specialization. Click a skill to update your
          progress. Skills are locked until prerequisites are completed.
        </p>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8">
        {/* Foundation Column */}
        <div>
          <ColumnHeader
            level={1}
            title="Foundation"
            description="Build your fundamental skills"
            count={skills.foundation.length}
            completedCount={foundationCompleted}
          />
          <div className="space-y-4">
            {skills.foundation.length > 0 ? (
              skills.foundation.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isLocked={calculateIsLocked(skill, allSkills)}
                />
              ))
            ) : (
              <Card className="p-6 border-dashed">
                <p className="text-sm text-zinc-500 text-center">No foundation skills yet</p>
              </Card>
            )}
          </div>
        </div>

        {/* Connector 1 */}
        <ColumnConnector />

        {/* Core Column */}
        <div>
          <ColumnHeader
            level={2}
            title="Core"
            description="Master essential competencies"
            count={skills.core.length}
            completedCount={coreCompleted}
          />
          <div className="space-y-4">
            {skills.core.length > 0 ? (
              skills.core.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isLocked={calculateIsLocked(skill, allSkills)}
                />
              ))
            ) : (
              <Card className="p-6 border-dashed">
                <p className="text-sm text-zinc-500 text-center">No core skills yet</p>
              </Card>
            )}
          </div>
        </div>

        {/* Connector 2 */}
        <ColumnConnector />

        {/* Specialization Column */}
        <div>
          <ColumnHeader
            level={3}
            title="Specialization"
            description="Advanced expertise areas"
            count={skills.specialization.length}
            completedCount={specializationCompleted}
          />
          <div className="space-y-4">
            {skills.specialization.length > 0 ? (
              skills.specialization.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isLocked={calculateIsLocked(skill, allSkills)}
                />
              ))
            ) : (
              <Card className="p-6 border-dashed">
                <p className="text-sm text-zinc-500 text-center">
                  No specialization skills yet
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-zinc-50 border-zinc-200">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-zinc-400" />
              <span className="text-zinc-600">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-blue-600 bg-blue-100" />
              <span className="text-zinc-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border-2 border-green-600 bg-green-100" />
              <span className="text-zinc-600">Completed</span>
            </div>
            <div className="ml-auto text-zinc-500">
              <span className="font-medium text-zinc-900">{stats.completed}</span> of{' '}
              <span className="font-medium text-zinc-900">{stats.total}</span> skills completed
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
