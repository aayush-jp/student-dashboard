'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type SelectDomainResult = {
  success: boolean
  error?: string
}

export async function selectDomain(domainId: string): Promise<SelectDomainResult> {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'You must be logged in to select a domain' }
    }

    // Validate domainId
    if (!domainId || typeof domainId !== 'string') {
      return { success: false, error: 'Invalid domain ID' }
    }

    // Verify the domain exists
    const { data: domain, error: domainError } = await supabase
      .from('domains')
      .select('id')
      .eq('id', domainId)
      .single()

    if (domainError || !domain) {
      return { success: false, error: 'The selected domain does not exist' }
    }

    // Update the user's profile with the selected domain
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ selected_domain_id: domainId })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, error: `Failed to update profile: ${updateError.message}` }
    }

    // Revalidate the cache
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
    }
  }
}
