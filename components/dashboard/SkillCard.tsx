'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  TrendingUp,
  Lock,
  ExternalLink,
  Video,
  FileText,
  BookOpen,
  Code,
  Sparkles,
  Award,
} from 'lucide-react'
import { updateSkillStatus, getSkillResources, type SkillResourceData } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import type { SkillWithProgress } from '@/types/roadmap'
import { FocusTimer } from './FocusTimer'
import { QuizModal } from './QuizModal'

interface SkillCardProps {
  skill: SkillWithProgress
  isLocked: boolean
}

const resourceTypeIcons = {
  video: Video,
  article: FileText,
  documentation: FileText,
  course: BookOpen,
}

const resourceTypeBadges = {
  video: 'bg-red-100 text-red-700',
  article: 'bg-blue-100 text-blue-700',
  documentation: 'bg-purple-100 text-purple-700',
  course: 'bg-green-100 text-green-700',
}

export function SkillCard({ skill, isLocked }: SkillCardProps) {
  const router = useRouter()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [resources, setResources] = useState<SkillResourceData[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(skill.status)

  // Sync currentStatus with skill.status prop when it changes
  useEffect(() => {
    setCurrentStatus(skill.status)
  }, [skill.status])

  const statusConfig = {
    not_started: {
      icon: <Circle className="h-5 w-5 text-zinc-400" />,
      label: 'Not Started',
      borderColor: 'border-zinc-200',
      badgeColor: 'bg-zinc-100 text-zinc-700',
      cardBg: 'bg-white',
    },
    in_progress: {
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      label: 'In Progress',
      borderColor: 'border-blue-400 border-2',
      badgeColor: 'bg-blue-100 text-blue-700',
      cardBg: 'bg-blue-50/30',
    },
    completed: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
      label: 'Completed',
      borderColor: 'border-green-400 border-2',
      badgeColor: 'bg-green-100 text-green-700',
      cardBg: 'bg-green-50/30',
    },
  }

  const config = statusConfig[currentStatus]

  // Fetch resources when sheet opens
  useEffect(() => {
    if (isSheetOpen && !isLocked) {
      setLoadingResources(true)
      getSkillResources(skill.id).then((result) => {
        if (result.error) {
          console.error('Failed to fetch resources:', result.error)
        }
        setResources(result.resources)
        setLoadingResources(false)
      })
    }
  }, [isSheetOpen, skill.id, isLocked])

  const handleCardClick = () => {
    if (isLocked) return
    setIsSheetOpen(true)
  }

  const handleStatusChange = (newStatus: 'not_started' | 'in_progress' | 'completed') => {
    startTransition(async () => {
      const result = await updateSkillStatus({
        skillId: skill.id,
        newStatus,
      })

      if (result.success) {
        setCurrentStatus(newStatus)
        toast.success('Progress Updated', {
          description: `${skill.name} marked as ${newStatus.replace('_', ' ')}`,
        })
        setIsSheetOpen(false)
      } else {
        toast.error('Update Failed', {
          description: result.error || 'Could not update skill status',
        })
      }
    })
  }

  // Locked state styling
  const lockedStyles = isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'

  return (
    <>
      <button
        onClick={handleCardClick}
        disabled={isLocked}
        className={`w-full text-left transition-all ${lockedStyles}`}
        type="button"
      >
        <Card className={`${config.borderColor} ${config.cardBg} transition-all relative`}>
          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900/90">
                <Lock className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-medium leading-tight">{skill.name}</CardTitle>
              {!isLocked && config.icon}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {skill.description && (
              <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                {skill.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}
              >
                {config.label}
              </span>
              {skill.is_core && <span className="text-xs text-blue-600 font-medium">Core</span>}
            </div>
            {isLocked && (
              <p className="text-xs text-zinc-500 italic">Complete prerequisites first</p>
            )}
          </CardContent>
        </Card>
      </button>

      {/* Skill Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="space-y-3 pb-6 border-b">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <SheetTitle className="text-2xl font-bold">{skill.name}</SheetTitle>
                {skill.description && (
                  <SheetDescription className="mt-2 text-base leading-relaxed">
                    {skill.description}
                  </SheetDescription>
                )}
              </div>
              {config.icon}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.badgeColor}`}
              >
                {config.label}
              </span>
              {skill.is_core && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  Core Skill
                </span>
              )}
            </div>
          </SheetHeader>

          <div className="py-6 space-y-8">
            {/* Focus Timer Section */}
            <FocusTimer skillId={skill.id} skillName={skill.name} />

            {/* Divider */}
            <div className="border-t border-zinc-200" />

            {/* Learning Resources Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learning Resources
              </h3>

              {loadingResources ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-zinc-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : resources.length > 0 ? (
                <div className="space-y-3">
                  {resources.map((resource) => {
                    const Icon = resourceTypeIcons[resource.type]
                    const badgeColor = resourceTypeBadges[resource.type]

                    return (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 border border-zinc-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">
                            <Icon className="h-5 w-5 text-zinc-600 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
                                {resource.title}
                              </h4>
                              <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
                            >
                              {resource.type}
                            </span>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-zinc-300 rounded-lg">
                  <BookOpen className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                  <p className="text-sm text-zinc-600">
                    No resources available yet for this skill.
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Check back soon for learning materials!</p>
                </div>
              )}
            </div>

            {/* AI Insight Section - THE NOVELTY */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Insight
              </h3>
              <div className="p-6 bg-linear-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    <p className="text-sm font-medium text-blue-900">
                      Analyzing learning patterns...
                    </p>
                  </div>
                  <p className="text-sm text-zinc-700 leading-relaxed">
                    Our AI is analyzing your progress and will provide personalized recommendations
                    to optimize your learning path. This feature will suggest the best resources,
                    identify knowledge gaps, and predict optimal learning times based on your
                    activity.
                  </p>
                  <div className="pt-2 space-y-2">
                    {[40, 60, 80].map((width, i) => (
                      <div key={i} className="h-2 bg-blue-200/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full animate-pulse"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Requirement Callout for In-Progress Skills */}
            {currentStatus === 'in_progress' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">Ready to complete this skill?</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Take a quick 3-question quiz to validate your knowledge and mark this skill as completed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t">
              {currentStatus === 'not_started' && (
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  {isPending ? 'Updating...' : 'Start Learning'}
                  <TrendingUp className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStatus === 'in_progress' && (
                <>
                  {/* Primary action: Take the quiz to complete */}
                  <Button
                    onClick={() => setIsQuizOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Take Quiz to Complete
                  </Button>
                  
                  {/* Secondary action: Reset if needed */}
                  <Button
                    onClick={() => handleStatusChange('not_started')}
                    disabled={isPending}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                  >
                    {isPending ? 'Resetting...' : 'Reset Progress'}
                  </Button>
                </>
              )}

              {currentStatus === 'completed' && (
                <>
                  {/* Completion Badge */}
                  <div className="p-6 bg-linear-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="relative">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-600 rounded-full flex items-center justify-center">
                          <Award className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-green-900">Skill Mastered!</p>
                      <p className="text-sm text-green-700 mt-1">
                        You've successfully completed this skill
                      </p>
                    </div>
                  </div>

                  {/* Review Quiz Button */}
                  <Button
                    onClick={() => setIsQuizOpen(true)}
                    variant="outline"
                    className="w-full border-green-300 hover:bg-green-50"
                    size="lg"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Review Quiz
                  </Button>

                  {/* Revisit Practice Button */}
                  <Button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={isPending}
                    variant="ghost"
                    className="w-full"
                    size="sm"
                  >
                    {isPending ? 'Updating...' : 'Revisit & Practice'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quiz Modal */}
      <QuizModal
        skillId={skill.id}
        skillName={skill.name}
        isOpen={isQuizOpen}
        onClose={() => {
          setIsQuizOpen(false)
          // Close the skill sheet as well to show the updated dashboard
          setIsSheetOpen(false)
          // Refresh the router to fetch updated data from server
          // This will get the latest skill status after quiz completion
          router.refresh()
        }}
      />
    </>
  )
}
