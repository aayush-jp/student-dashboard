'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, Save, Timer } from 'lucide-react'
import { logStudySession } from '@/app/dashboard/actions'
import { toast } from 'sonner'

interface FocusTimerProps {
  skillId: string
  skillName: string
}

export function FocusTimer({ skillId, skillName }: FocusTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleFinish = async () => {
    if (seconds === 0) {
      toast.error('No Time Logged', {
        description: 'Timer must be started before finishing a session',
      })
      return
    }

    setIsLogging(true)
    setIsRunning(false)

    const result = await logStudySession({
      skillId,
      durationInSeconds: seconds,
    })

    setIsLogging(false)

    if (result.success) {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      const timeText =
        minutes > 0
          ? `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ''}`
          : `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`

      toast.success('Session Logged!', {
        description: `Focused on ${skillName} for ${timeText}`,
      })

      // Reset timer
      setSeconds(0)
    } else {
      toast.error('Failed to Log Session', {
        description: result.error || 'Could not save study session',
      })
    }
  }

  const hasTime = seconds > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-900">
        <Timer className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Focus Timer</h3>
      </div>

      {/* Timer Display */}
      <div className="relative">
        <div
          className={`
          relative flex items-center justify-center w-full h-32 rounded-2xl
          bg-linear-to-br from-blue-600 to-blue-700
          ${isRunning ? 'animate-pulse' : ''}
          transition-all duration-300
        `}
        >
          {/* Pulsing Glow Effect when running */}
          {isRunning && (
            <div className="absolute inset-0 rounded-2xl bg-blue-400 opacity-50 blur-xl animate-pulse" />
          )}

          {/* Timer Text */}
          <div className="relative z-10 text-center">
            <div className="text-5xl font-bold text-white tracking-wider font-mono">
              {formatTime(seconds)}
            </div>
            <div className="text-sm text-blue-100 mt-1">
              {isRunning ? 'Focus Mode Active' : hasTime ? 'Paused' : 'Ready to Focus'}
            </div>
          </div>

          {/* Corner Indicator */}
          {isRunning && (
            <div className="absolute top-3 right-3">
              <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            disabled={isLogging}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {hasTime ? 'Resume' : 'Start Focus'}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            disabled={isLogging}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </Button>
        )}

        <Button
          onClick={handleFinish}
          disabled={!hasTime || isLogging}
          variant="outline"
          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLogging ? 'Saving...' : 'Finish Session'}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-center text-zinc-500">
        Track your focused study time. Sessions are logged to your progress history.
      </p>
    </div>
  )
}
