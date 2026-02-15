import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { DomainGrid } from './domain-grid'
import { BookOpen } from 'lucide-react'
import type { Domain } from '@/types/database'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  // Check if user already has a selected domain
  const { data: profile } = await supabase
    .from('profiles')
    .select('selected_domain_id')
    .eq('id', user.id)
    .single()

  if (profile?.selected_domain_id) {
    redirect('/dashboard')
  }

  // Fetch all available domains
  const { data: domains, error: domainsError } = await supabase
    .from('domains')
    .select('*')
    .order('name', { ascending: true })

  if (domainsError) {
    throw new Error(`Failed to fetch domains: ${domainsError.message}`)
  }

  const typedDomains: Domain[] = domains || []

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
            Choose your academic path
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Select the domain that aligns with your learning goals. You can change this later in your
            settings.
          </p>
        </div>

        {/* Domain Grid - Client Component */}
        <DomainGrid domains={typedDomains} />

        {/* Footer */}
        <div className="text-center text-sm text-zinc-500">
          <p>Not sure which path to choose? You can explore all options later.</p>
        </div>
      </div>
    </div>
  )
}
