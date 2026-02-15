export type Domain = {
  id: string
  name: string
  description: string | null
  icon: string | null
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  selected_domain_id: string | null
  created_at: string
}

export type UserProgress = {
  user_id: string
  skill_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
}

export type SkillResource = {
  id: string
  skill_id: string
  title: string
  url: string
  type: 'video' | 'article' | 'documentation' | 'course'
  created_at: string
}
