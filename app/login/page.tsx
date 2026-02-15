'use client'

import { useActionState, useEffect, useState } from 'react'
import { login, signup, type FormState } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react'

const initialState: FormState = {
  errors: {},
  message: '',
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginState, loginAction, isLoginPending] = useActionState(login, initialState)
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState)

  const currentState = mode === 'login' ? loginState : signupState
  const currentAction = mode === 'login' ? loginAction : signupAction
  const isPending = mode === 'login' ? isLoginPending : isSignupPending

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Academic Quote/Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900 opacity-50" />
        <div className="relative z-10 max-w-lg space-y-8">
          <BookOpen className="h-20 w-20 text-blue-400" />
          <blockquote className="text-3xl font-light leading-relaxed">
            "Education is the most powerful weapon which you can use to change the world."
          </blockquote>
          <p className="text-zinc-400 text-lg">— Nelson Mandela</p>
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">100+</div>
              <div className="text-sm text-zinc-400">Courses</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">5K+</div>
              <div className="text-sm text-zinc-400">Students</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-blue-400">95%</div>
              <div className="text-sm text-zinc-400">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login/Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <Card className="w-full max-w-md shadow-lg border-zinc-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-zinc-900">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <CardDescription className="text-zinc-600">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Sign up to start your learning journey'}
            </CardDescription>
          </CardHeader>

          <form action={currentAction}>
            <CardContent className="space-y-4">
              {/* Error Messages */}
              {currentState.errors?.general && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    {currentState.errors.general.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="student@university.edu"
                    className="pl-10"
                    aria-describedby="email-error"
                    required
                  />
                </div>
                {currentState.errors?.email && (
                  <p id="email-error" className="text-sm text-red-600">
                    {currentState.errors.email[0]}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    aria-describedby="password-error"
                    required
                  />
                </div>
                {currentState.errors?.password && (
                  <p id="password-error" className="text-sm text-red-600">
                    {currentState.errors.password[0]}
                  </p>
                )}
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                disabled={isPending}
              >
                {isPending ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Sign Up'}
              </Button>

              <div className="text-center text-sm text-zinc-600">
                {mode === 'login' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Log in
                    </button>
                  </>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
