'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { RoadmapData, SkillWithProgress, SkillsByDifficulty, SkillStatus } from '@/types/roadmap'
import type { Domain } from '@/types/database'

type SkillQueryResult = {
  skill_id: string
  skill_name: string
  skill_description: string | null
  difficulty_level: number
  is_core: boolean
  status: SkillStatus | null
  completed_at: string | null
}

export async function getStudentRoadmap(): Promise<RoadmapData | null> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized: User not authenticated')
    }

    // Fetch user's profile to get selected_domain_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('selected_domain_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Profile not found')
    }

    if (!profile.selected_domain_id) {
      // User hasn't selected a domain yet
      return null
    }

    // Fetch the Domain details
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('*')
      .eq('id', profile.selected_domain_id)
      .single()

    if (domainError || !domain) {
      throw new Error('Domain not found')
    }

    // Fetch all skills for this domain with user progress
    // Using a LEFT JOIN approach via Supabase's query builder
    const { data: domainSkills, error: skillsError } = await supabase
      .from('domain_skills')
      .select(`
        skill_id,
        is_core,
        skills (
          id,
          name,
          description,
          difficulty_level
        )
      `)
      .eq('domain_id', profile.selected_domain_id)
      .order('skills(difficulty_level)', { ascending: true })

    if (skillsError) {
      throw new Error(`Failed to fetch skills: ${skillsError.message}`)
    }

    if (!domainSkills || domainSkills.length === 0) {
      // No skills for this domain yet
      return {
        domain: domain as Domain,
        skills: {
          foundation: [],
          core: [],
          specialization: [],
        },
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          percentComplete: 0,
        },
      }
    }

    // Fetch user progress for all these skills
    const skillIds = domainSkills
      .map((ds) => (ds.skills as any)?.id)
      .filter((id): id is string => id != null)

    const { data: userProgressData, error: progressError } = await supabase
      .from('user_progress')
      .select('skill_id, status, completed_at')
      .eq('user_id', user.id)
      .in('skill_id', skillIds)

    if (progressError) {
      throw new Error(`Failed to fetch user progress: ${progressError.message}`)
    }

    // Fetch skill dependencies for all skills
    const { data: dependenciesData, error: dependenciesError } = await supabase
      .from('skill_dependencies')
      .select('skill_id, prerequisite_skill_id')
      .in('skill_id', skillIds)

    if (dependenciesError) {
      throw new Error(`Failed to fetch dependencies: ${dependenciesError.message}`)
    }

    // Create a map of skill_id -> prerequisite skill IDs
    const dependenciesMap = new Map<string, string[]>()
    if (dependenciesData) {
      dependenciesData.forEach((dep) => {
        const existing = dependenciesMap.get(dep.skill_id) || []
        existing.push(dep.prerequisite_skill_id)
        dependenciesMap.set(dep.skill_id, existing)
      })
    }

    // Create a map of skill_id -> progress for quick lookup
    const progressMap = new Map<string, { status: SkillStatus; completed_at: string | null }>()
    if (userProgressData) {
      userProgressData.forEach((progress) => {
        progressMap.set(progress.skill_id, {
          status: progress.status as SkillStatus,
          completed_at: progress.completed_at,
        })
      })
    }

    // Transform and combine the data
    const skillsWithProgress: SkillWithProgress[] = domainSkills
      .map((ds) => {
        const skill = ds.skills as any
        if (!skill) return null

        const progress = progressMap.get(skill.id)
        const prerequisites = dependenciesMap.get(skill.id) || []

        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          difficulty_level: skill.difficulty_level ?? 1,
          is_core: ds.is_core ?? true,
          status: progress?.status ?? 'not_started',
          completed_at: progress?.completed_at ?? null,
          prerequisites,
        } as SkillWithProgress
      })
      .filter((skill): skill is SkillWithProgress => skill !== null)

    // Group skills by difficulty level
    const groupedSkills: SkillsByDifficulty = {
      foundation: skillsWithProgress.filter((s) => s.difficulty_level === 1),
      core: skillsWithProgress.filter((s) => s.difficulty_level === 2),
      specialization: skillsWithProgress.filter((s) => s.difficulty_level === 3),
    }

    // Calculate statistics
    const total = skillsWithProgress.length
    const completed = skillsWithProgress.filter((s) => s.status === 'completed').length
    const inProgress = skillsWithProgress.filter((s) => s.status === 'in_progress').length
    const notStarted = skillsWithProgress.filter((s) => s.status === 'not_started').length
    const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      domain: domain as Domain,
      skills: groupedSkills,
      stats: {
        total,
        completed,
        inProgress,
        notStarted,
        percentComplete,
      },
    }
  } catch (error) {
    console.error('Error fetching student roadmap:', error)
    throw error
  }
}

export type UpdateSkillStatusParams = {
  skillId: string
  newStatus: SkillStatus
}

export type UpdateSkillStatusResult = {
  success: boolean
  error?: string
}

/**
 * Updates a skill's status with prerequisite validation.
 * The Novelty: Validates that all prerequisite skills are completed
 * before allowing a skill to be marked as 'in_progress' or 'completed'.
 */
export async function updateSkillStatus({
  skillId,
  newStatus,
}: UpdateSkillStatusParams): Promise<UpdateSkillStatusResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    // Validate skillId
    if (!skillId || typeof skillId !== 'string') {
      return { success: false, error: 'Invalid skill ID' }
    }

    // THE NOVELTY: Check prerequisites if trying to start or complete a skill
    if (newStatus === 'in_progress' || newStatus === 'completed') {
      // Query skill_dependencies to find all prerequisites for this skill
      const { data: dependencies, error: depsError } = await supabase
        .from('skill_dependencies')
        .select(`
          prerequisite_skill_id,
          skills!skill_dependencies_prerequisite_skill_id_fkey (
            id,
            name
          )
        `)
        .eq('skill_id', skillId)

      if (depsError) {
        return { success: false, error: `Failed to fetch prerequisites: ${depsError.message}` }
      }

      // If there are prerequisites, check if all are completed
      if (dependencies && dependencies.length > 0) {
        const prerequisiteIds = dependencies.map((dep) => dep.prerequisite_skill_id)

        // Fetch user's progress for all prerequisite skills
        const { data: prerequisiteProgress, error: progressError } = await supabase
          .from('user_progress')
          .select('skill_id, status')
          .eq('user_id', user.id)
          .in('skill_id', prerequisiteIds)

        if (progressError) {
          return {
            success: false,
            error: `Failed to check prerequisite progress: ${progressError.message}`,
          }
        }

        // Create a map of completed prerequisites
        const completedPrerequisites = new Set(
          prerequisiteProgress
            ?.filter((progress) => progress.status === 'completed')
            .map((progress) => progress.skill_id) || []
        )

        // Check if all prerequisites are completed
        for (const dep of dependencies) {
          if (!completedPrerequisites.has(dep.prerequisite_skill_id)) {
            // Find the prerequisite skill name
            const prerequisiteSkill = (dep.skills as any)
            const skillName = prerequisiteSkill?.name || 'Unknown skill'
            return {
              success: false,
              error: `Prerequisite "${skillName}" must be completed first`,
            }
          }
        }
      }
    }

    // Prepare the update data
    const updateData: {
      status: SkillStatus
      completed_at?: string | null
    } = {
      status: newStatus,
    }

    // Set completed_at timestamp if status is 'completed'
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (newStatus === 'not_started' || newStatus === 'in_progress') {
      updateData.completed_at = null
    }

    // Upsert user progress
    const { error: upsertError } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: user.id,
          skill_id: skillId,
          ...updateData,
        },
        {
          onConflict: 'user_id,skill_id',
        }
      )

    if (upsertError) {
      return { success: false, error: `Failed to update progress: ${upsertError.message}` }
    }

    // Revalidate the dashboard path to show updated data
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

// Legacy function - kept for backwards compatibility
export async function updateSkillProgress({
  skillId,
  status,
}: {
  skillId: string
  status: SkillStatus
}): Promise<UpdateSkillStatusResult> {
  return updateSkillStatus({ skillId, newStatus: status })
}

export type SkillResourceData = {
  id: string
  skill_id: string
  title: string
  url: string
  type: 'video' | 'article' | 'documentation' | 'course'
  created_at: string
}

export type GetSkillResourcesResult = {
  resources: SkillResourceData[]
  error?: string
}

/**
 * Fetches learning resources for a specific skill.
 * Queries the 'resources' table with skill_id match.
 */
export type LogStudySessionParams = {
  skillId: string
  durationInSeconds: number
}

export type LogStudySessionResult = {
  success: boolean
  error?: string
}

/**
 * Logs a focus/study session for a specific skill.
 * Records the duration and timestamp for progress tracking.
 */
export async function logStudySession({
  skillId,
  durationInSeconds,
}: LogStudySessionParams): Promise<LogStudySessionResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Unauthorized: User not authenticated' }
    }

    // Validate inputs
    if (!skillId || typeof skillId !== 'string') {
      return { success: false, error: 'Invalid skill ID' }
    }

    if (typeof durationInSeconds !== 'number' || durationInSeconds <= 0) {
      return { success: false, error: 'Invalid duration' }
    }

    // Log the study session to database
    const now = new Date().toISOString()
    const { error: insertError } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      skill_id: skillId,
      duration_seconds: durationInSeconds,
      started_at: now,
      completed_at: now,
    })

    if (insertError) {
      console.error('Error inserting study session:', insertError)
      return { success: false, error: `Failed to log session: ${insertError.message}` }
    }

    // Optionally update user_progress to mark skill as in_progress if not started
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('status')
      .eq('user_id', user.id)
      .eq('skill_id', skillId)
      .single()

    if (!currentProgress) {
      // No progress record exists, create one with in_progress status
      await supabase.from('user_progress').insert({
        user_id: user.id,
        skill_id: skillId,
        status: 'in_progress',
        completed_at: null,
      })
    } else if (currentProgress.status === 'not_started') {
      // Update to in_progress
      await supabase
        .from('user_progress')
        .update({ status: 'in_progress' })
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
    }

    // Revalidate the dashboard
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error logging study session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log study session',
    }
  }
}

export type WeeklyEffortData = {
  skillName: string
  minutes: number
  skillId: string
}

export type GetWeeklyEffortResult = {
  data: WeeklyEffortData[]
  error?: string
}

/**
 * Fetches weekly effort data for the current user.
 * Aggregates study sessions from the last 7 days grouped by skill.
 */
export async function getWeeklyEffort(): Promise<GetWeeklyEffortResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { data: [], error: 'Unauthorized: User not authenticated' }
    }

    // Calculate date 7 days ago
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Fetch study sessions from the last 7 days with skill information
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select(
        `
        skill_id,
        duration_seconds,
        skills (
          name
        )
      `
      )
      .eq('user_id', user.id)
      .gte('completed_at', sevenDaysAgo.toISOString())
      .order('completed_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching study sessions:', sessionsError)
      return { data: [], error: sessionsError.message }
    }

    if (!sessions || sessions.length === 0) {
      return { data: [] }
    }

    // Group by skill_id and sum durations
    const skillMap = new Map<
      string,
      { skillName: string; totalSeconds: number; skillId: string }
    >()

    sessions.forEach((session) => {
      const skillName = (session.skills as any)?.name || 'Unknown Skill'
      const existing = skillMap.get(session.skill_id)

      if (existing) {
        existing.totalSeconds += session.duration_seconds
      } else {
        skillMap.set(session.skill_id, {
          skillName,
          totalSeconds: session.duration_seconds,
          skillId: session.skill_id,
        })
      }
    })

    // Convert to array and transform to minutes
    const effortData: WeeklyEffortData[] = Array.from(skillMap.values())
      .map((item) => ({
        skillName: item.skillName,
        minutes: Math.round(item.totalSeconds / 60),
        skillId: item.skillId,
      }))
      .sort((a, b) => b.minutes - a.minutes) // Sort by minutes descending

    return { data: effortData }
  } catch (error) {
    console.error('Error fetching weekly effort:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch weekly effort',
    }
  }
}

export type RecommendationType = 'warning' | 'success' | 'info'

export type Recommendation = {
  type: RecommendationType
  message: string
  skillName?: string
  skillId?: string
}

export type GetSmartRecommendationsResult = {
  recommendations: Recommendation[]
  error?: string
}

/**
 * Smart Recommendation Engine - The 'AI' Feature
 * Analyzes user progress and study patterns to provide personalized recommendations.
 */
export async function getSmartRecommendations(): Promise<GetSmartRecommendationsResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { recommendations: [], error: 'Unauthorized: User not authenticated' }
    }

    const recommendations: Recommendation[] = []

    // Fetch all user progress
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select(
        `
        skill_id,
        status,
        completed_at,
        skills (
          id,
          name,
          difficulty_level
        )
      `
      )
      .eq('user_id', user.id)

    if (progressError) {
      return { recommendations: [], error: `Failed to fetch progress: ${progressError.message}` }
    }

    if (!userProgress || userProgress.length === 0) {
      return { recommendations: [] }
    }

    // Fetch all study sessions for this user
    const { data: studySessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('skill_id, duration_seconds')
      .eq('user_id', user.id)

    if (sessionsError) {
      return {
        recommendations: [],
        error: `Failed to fetch study sessions: ${sessionsError.message}`,
      }
    }

    // Create a map of skill_id -> total seconds spent
    const studyTimeMap = new Map<string, number>()
    if (studySessions) {
      studySessions.forEach((session) => {
        const existing = studyTimeMap.get(session.skill_id) || 0
        studyTimeMap.set(session.skill_id, existing + session.duration_seconds)
      })
    }

    // Check for last study session date for consistency check (Rule 3)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: recentSessions, error: recentError } = await supabase
      .from('study_sessions')
      .select('completed_at, skill_id')
      .eq('user_id', user.id)
      .gte('completed_at', threeDaysAgo.toISOString())
      .order('completed_at', { ascending: false })
      .limit(1)

    if (recentError) {
      console.error('Error fetching recent sessions:', recentError)
    }

    const hasRecentActivity = recentSessions && recentSessions.length > 0

    // THE AI LOGIC: Analyze each skill with progress
    userProgress.forEach((progress) => {
      const skill = progress.skills as any
      if (!skill) return

      const skillName = skill.name
      const skillId = skill.id
      const difficultyLevel = skill.difficulty_level ?? 1
      const status = progress.status as SkillStatus

      const totalSecondsSpent = studyTimeMap.get(progress.skill_id) || 0
      const hoursSpent = totalSecondsSpent / 3600

      // Expected hours based on difficulty level
      const expectedHours = difficultyLevel * 2

      // RULE 1: Struggling Detection (High Effort)
      if (status === 'in_progress' && hoursSpent > expectedHours * 1.5) {
        recommendations.push({
          type: 'warning',
          message: `High effort detected in ${skillName}. Consider reviewing prerequisites or seeking additional resources.`,
          skillName,
          skillId,
        })
      }

      // RULE 2: Rushing Detection (Fast Completion)
      if (status === 'completed' && hoursSpent < expectedHours * 0.5 && hoursSpent > 0) {
        recommendations.push({
          type: 'warning',
          message: `You completed ${skillName} very fast (${hoursSpent.toFixed(1)}h vs expected ${expectedHours}h). Verify your knowledge with a project or exercise.`,
          skillName,
          skillId,
        })
      }

      // Success recommendation for good pace
      if (
        status === 'completed' &&
        hoursSpent >= expectedHours * 0.5 &&
        hoursSpent <= expectedHours * 1.5
      ) {
        recommendations.push({
          type: 'success',
          message: `Great pace on ${skillName}! You completed it in ${hoursSpent.toFixed(1)} hours.`,
          skillName,
          skillId,
        })
      }
    })

    // RULE 3: Consistency Check (Learning Streak)
    if (!hasRecentActivity && userProgress.some((p) => p.status === 'in_progress')) {
      // Find an in-progress skill to recommend
      const inProgressSkill = userProgress.find((p) => p.status === 'in_progress')
      const skill = inProgressSkill?.skills as any

      if (skill) {
        recommendations.push({
          type: 'info',
          message: `Learning streak broken. Try spending 15 minutes on ${skill.name} today to maintain momentum.`,
          skillName: skill.name,
          skillId: skill.id,
        })
      } else {
        recommendations.push({
          type: 'info',
          message: 'Learning streak broken. Try spending 15 minutes on your current skills today to maintain momentum.',
        })
      }
    }

    // Add general encouragement if no recommendations
    if (recommendations.length === 0 && userProgress.length > 0) {
      recommendations.push({
        type: 'success',
        message: "You're on track! Keep up the great work and maintain consistent study sessions.",
      })
    }

    // Sort recommendations by priority: warning > info > success
    const priorityOrder: Record<RecommendationType, number> = {
      warning: 1,
      info: 2,
      success: 3,
    }

    recommendations.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])

    return { recommendations }
  } catch (error) {
    console.error('Error generating smart recommendations:', error)
    return {
      recommendations: [],
      error: error instanceof Error ? error.message : 'Failed to generate recommendations',
    }
  }
}

export async function getSkillResources(skillId: string): Promise<GetSkillResourcesResult> {
  try {
    const supabase = await createClient()

    // Get the current user (for authentication)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { resources: [], error: 'Unauthorized: User not authenticated' }
    }

    // Validate skillId
    if (!skillId || typeof skillId !== 'string') {
      return { resources: [], error: 'Invalid skill ID' }
    }

    // Fetch resources for this skill from the 'resources' table
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .eq('skill_id', skillId)
      .order('type', { ascending: true })

    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError.message)
      return { resources: [], error: resourcesError.message }
    }

    return {
      resources: (resources || []) as SkillResourceData[],
    }
  } catch (error) {
    console.error('Error fetching skill resources:', error)
    return {
      resources: [],
      error: error instanceof Error ? error.message : 'Failed to fetch resources',
    }
  }
}

// ============================================================================
// QUIZ GENERATION ENGINE
// ============================================================================

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctAnswerIndex: number
}

export type GenerateQuizResult = {
  questions: QuizQuestion[]
  error?: string
}

/**
 * Quiz Generation Engine - The 'Mock Mode' Feature
 * Generates a fixed set of 3 multiple-choice questions for a skill.
 * Currently returns generic coding questions labeled as skill-specific.
 */
export async function generateQuiz(skillId: string): Promise<GenerateQuizResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { questions: [], error: 'Unauthorized: User not authenticated' }
    }

    // Validate skillId
    if (!skillId || typeof skillId !== 'string') {
      return { questions: [], error: 'Invalid skill ID' }
    }

    // Fetch skill name for context (optional but good for UX)
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('name')
      .eq('id', skillId)
      .single()

    if (skillError || !skill) {
      return { questions: [], error: 'Skill not found' }
    }

    // MOCK MODE: Return fixed generic coding questions
    // In a production system, these would be dynamically generated or fetched from a question bank
    const questions: QuizQuestion[] = [
      {
        id: 'q1',
        question: 'What is a variable in programming?',
        options: [
          'A container for storing data values',
          'A type of loop',
          'A function that returns nothing',
          'A programming language',
        ],
        correctAnswerIndex: 0,
      },
      {
        id: 'q2',
        question: 'What is a function in programming?',
        options: [
          'A variable that stores numbers',
          'A reusable block of code that performs a specific task',
          'A data structure for storing arrays',
          'A syntax error in code',
        ],
        correctAnswerIndex: 1,
      },
      {
        id: 'q3',
        question: 'What does an "if" statement do?',
        options: [
          'Repeats code multiple times',
          'Stores data permanently',
          'Executes code only when a condition is true',
          'Defines a new function',
        ],
        correctAnswerIndex: 2,
      },
    ]

    return { questions }
  } catch (error) {
    console.error('Error generating quiz:', error)
    return {
      questions: [],
      error: error instanceof Error ? error.message : 'Failed to generate quiz',
    }
  }
}

export type SubmitQuizParams = {
  skillId: string
  answers: number[]
}

export type SubmitQuizResult = {
  success: boolean
  score: number
  passed: boolean
  error?: string
}

/**
 * Quiz Submission Engine
 * Evaluates user answers, calculates score, and updates progress.
 * If score >= 66% (2/3 correct), marks the skill as 'completed'.
 */
export async function submitQuiz({
  skillId,
  answers,
}: SubmitQuizParams): Promise<SubmitQuizResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, score: 0, passed: false, error: 'Unauthorized: User not authenticated' }
    }

    // Validate inputs
    if (!skillId || typeof skillId !== 'string') {
      return { success: false, score: 0, passed: false, error: 'Invalid skill ID' }
    }

    if (!Array.isArray(answers) || answers.length !== 3) {
      return { success: false, score: 0, passed: false, error: 'Invalid answers format. Expected 3 answers.' }
    }

    // Validate all answers are valid indices (0-3)
    for (const answer of answers) {
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        return {
          success: false,
          score: 0,
          passed: false,
          error: 'Invalid answer index. Must be between 0 and 3.',
        }
      }
    }

    // Hardcoded correct answers (matching the questions from generateQuiz)
    const correctAnswers = [0, 1, 2]

    // Calculate score
    let correctCount = 0
    for (let i = 0; i < answers.length; i++) {
      if (answers[i] === correctAnswers[i]) {
        correctCount++
      }
    }

    const score = Math.round((correctCount / answers.length) * 100)
    const passed = score >= 66 // 66% threshold (2 out of 3 correct)

    // Insert quiz attempt into database
    const { error: insertError } = await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      skill_id: skillId,
      score: score,
      passed: passed,
      attempted_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('Error inserting quiz attempt:', insertError)
      return {
        success: false,
        score: score,
        passed: passed,
        error: `Failed to save quiz attempt: ${insertError.message}`,
      }
    }

    // If passed, update user_progress to 'completed'
    if (passed) {
      const { error: updateError } = await supabase
        .from('user_progress')
        .upsert(
          {
            user_id: user.id,
            skill_id: skillId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,skill_id',
          }
        )

      if (updateError) {
        console.error('Error updating user progress:', updateError)
        // Still return success for quiz submission, but log the error
        return {
          success: true,
          score: score,
          passed: passed,
          error: `Quiz saved but failed to update progress: ${updateError.message}`,
        }
      }

      // Revalidate dashboard to show updated progress
      revalidatePath('/dashboard')
    }

    return {
      success: true,
      score: score,
      passed: passed,
    }
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return {
      success: false,
      score: 0,
      passed: false,
      error: error instanceof Error ? error.message : 'Failed to submit quiz',
    }
  }
}

// ============================================================================
// COMPLETION PREDICTION ENGINE
// ============================================================================

type StudySession = {
  date: string // Format: "YYYY-MM-DD"
  hours: number
}

type PredictionRequest = {
  sessions: StudySession[]
  remaining_hours: number
}

type PredictionResponse = {
  status: 'success' | 'insufficient_data' | 'stalled'
  predicted_date?: string
  velocity_hours_per_day?: number
  message?: string
}

export type GetCompletionPredictionResult = {
  prediction: PredictionResponse | null
  error?: string
}

/**
 * Completion Prediction Engine
 * Uses ML model to predict when the user will complete their learning track
 * based on their study patterns and remaining work.
 */
export async function getCompletionPrediction(): Promise<GetCompletionPredictionResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { prediction: null, error: 'Unauthorized: User not authenticated' }
    }

    // Fetch user's selected domain
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('selected_domain_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.selected_domain_id) {
      return { prediction: null, error: 'No domain selected' }
    }

    // Fetch all study sessions for the user
    const { data: studySessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('started_at, duration_seconds')
      .eq('user_id', user.id)
      .order('started_at', { ascending: true })

    if (sessionsError) {
      return { prediction: null, error: `Failed to fetch study sessions: ${sessionsError.message}` }
    }

    if (!studySessions || studySessions.length < 3) {
      return {
        prediction: {
          status: 'insufficient_data',
          message: 'Need at least 3 study sessions to predict.',
        },
      }
    }

    // Fetch all skills for the user's domain with their progress
    const { data: domainSkills, error: skillsError } = await supabase
      .from('domain_skills')
      .select(`
        skill_id,
        skills (
          id,
          difficulty_level
        )
      `)
      .eq('domain_id', profile.selected_domain_id)

    if (skillsError) {
      return { prediction: null, error: `Failed to fetch skills: ${skillsError.message}` }
    }

    if (!domainSkills || domainSkills.length === 0) {
      return { prediction: null, error: 'No skills found for this domain' }
    }

    // Get all skill IDs
    const skillIds = domainSkills
      .map((ds) => (ds.skills as any)?.id)
      .filter((id): id is string => id != null)

    // Fetch user progress to identify incomplete skills
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('skill_id, status')
      .eq('user_id', user.id)
      .in('skill_id', skillIds)

    if (progressError) {
      return { prediction: null, error: `Failed to fetch progress: ${progressError.message}` }
    }

    // Create a set of completed skill IDs
    const completedSkillIds = new Set(
      userProgress?.filter((p) => p.status === 'completed').map((p) => p.skill_id) || []
    )

    // Calculate remaining hours (sum of difficulty_level * 2 for incomplete skills)
    let remaining_hours = 0
    for (const ds of domainSkills) {
      const skill = ds.skills as any
      if (!skill || !skill.id) continue

      // If skill is not completed, add to remaining hours
      if (!completedSkillIds.has(skill.id)) {
        const difficultyLevel = skill.difficulty_level ?? 1
        remaining_hours += difficultyLevel * 2
      }
    }

    // If no remaining hours, user has completed everything
    if (remaining_hours === 0) {
      return {
        prediction: {
          status: 'success',
          predicted_date: new Date().toISOString().split('T')[0],
          message: 'All skills completed!',
        },
      }
    }

    // Group study sessions by date and sum hours
    const sessionsByDate = new Map<string, number>()
    for (const session of studySessions) {
      const date = session.started_at.split('T')[0] // Extract date part (YYYY-MM-DD)
      const hours = session.duration_seconds / 3600 // Convert seconds to hours
      const existing = sessionsByDate.get(date) || 0
      sessionsByDate.set(date, existing + hours)
    }

    // Format sessions for the ML API
    const sessions: StudySession[] = Array.from(sessionsByDate.entries())
      .map(([date, hours]) => ({
        date,
        hours: parseFloat(hours.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Prepare prediction request
    const predictionRequest: PredictionRequest = {
      sessions,
      remaining_hours: parseFloat(remaining_hours.toFixed(2)),
    }

    // Call the Python ML API
    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionRequest),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const prediction: PredictionResponse = await response.json()

      return { prediction }
    } catch (fetchError) {
      console.error('Error calling prediction API:', fetchError)
      return {
        prediction: null,
        error:
          fetchError instanceof Error
            ? `Prediction service unavailable: ${fetchError.message}`
            : 'Prediction service unavailable',
      }
    }
  } catch (error) {
    console.error('Error in getCompletionPrediction:', error)
    return {
      prediction: null,
      error: error instanceof Error ? error.message : 'Failed to generate prediction',
    }
  }
}
