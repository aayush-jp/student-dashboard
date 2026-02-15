'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

export type FormState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
  message?: string
}

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  // Validate form data
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        errors: {
          general: [error.message],
        },
      }
    }
  } catch (error) {
    return {
      errors: {
        general: ['An unexpected error occurred. Please try again.'],
      },
    }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signup(prevState: FormState, formData: FormData): Promise<FormState> {
  // Validate form data
  const validatedFields = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return {
        errors: {
          general: [error.message],
        },
      }
    }

    // Note: The middleware will handle redirecting to onboarding if needed
  } catch (error) {
    return {
      errors: {
        general: ['An unexpected error occurred. Please try again.'],
      },
    }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
