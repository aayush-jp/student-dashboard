import type { Domain } from './database'

export type SkillStatus = 'not_started' | 'in_progress' | 'completed'

export type SkillWithProgress = {
  id: string
  name: string
  description: string | null
  difficulty_level: number
  is_core: boolean
  status: SkillStatus
  completed_at: string | null
  prerequisites: string[] // Array of prerequisite skill IDs
}

export type SkillsByDifficulty = {
  foundation: SkillWithProgress[]  // difficulty_level = 1
  core: SkillWithProgress[]        // difficulty_level = 2
  specialization: SkillWithProgress[] // difficulty_level = 3
}

export type RoadmapData = {
  domain: Domain
  skills: SkillsByDifficulty
  stats: {
    total: number
    completed: number
    inProgress: number
    notStarted: number
    percentComplete: number
  }
}

export const DIFFICULTY_LEVELS = {
  FOUNDATION: 1,
  CORE: 2,
  SPECIALIZATION: 3,
} as const

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Foundation',
  2: 'Core',
  3: 'Specialization',
}
