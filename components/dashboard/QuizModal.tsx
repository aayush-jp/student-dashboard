'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { generateQuiz, submitQuiz, type QuizQuestion } from '@/app/dashboard/actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle, Brain, Trophy } from 'lucide-react'
import { toast } from 'sonner'

type QuizState = 'loading' | 'active' | 'result'

type QuizModalProps = {
  skillId: string
  skillName: string
  isOpen: boolean
  onClose: () => void
}

export function QuizModal({ skillId, skillName, isOpen, onClose }: QuizModalProps) {
  const [state, setState] = useState<QuizState>('loading')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState<number>(0)
  const [passed, setPassed] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Fetch quiz questions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchQuiz()
    } else {
      // Reset state when modal closes
      resetQuiz()
    }
  }, [isOpen, skillId])

  const fetchQuiz = async () => {
    setState('loading')
    setAnswers([])

    try {
      const result = await generateQuiz(skillId)

      if (result.error) {
        toast.error(`Failed to load quiz: ${result.error}`)
        onClose()
        return
      }

      if (result.questions.length === 0) {
        toast.error('No quiz questions available')
        onClose()
        return
      }

      setQuestions(result.questions)
      setAnswers(new Array(result.questions.length).fill(-1)) // Initialize with -1 (no selection)
      setState('active')
    } catch (error) {
      console.error('Error fetching quiz:', error)
      toast.error('Failed to load quiz. Please try again.')
      onClose()
    }
  }

  const resetQuiz = () => {
    setState('loading')
    setQuestions([])
    setAnswers([])
    setScore(0)
    setPassed(false)
    setIsSubmitting(false)
  }

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    // Validate all questions are answered
    if (answers.some((answer) => answer === -1)) {
      toast.error('Please answer all questions before submitting')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitQuiz({ skillId, answers })

      if (!result.success) {
        toast.error(result.error || 'Failed to submit quiz')
        setIsSubmitting(false)
        return
      }

      // Update state with results
      setScore(result.score)
      setPassed(result.passed)
      setState('result')
      setIsSubmitting(false)

      // If passed, trigger confetti and auto-close after 2 seconds
      if (result.passed) {
        toast.success(`Quiz passed! Skill marked as completed. (${result.score}%)`)
        triggerConfetti()
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        toast.error(`Quiz failed. Score: ${result.score}%. You need 66% to pass.`)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error('Failed to submit quiz. Please try again.')
      setIsSubmitting(false)
    }
  }

  const triggerConfetti = () => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  const allQuestionsAnswered = answers.every((answer) => answer !== -1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Brain className="h-5 w-5 text-blue-600" />
            Knowledge Check: {skillName}
          </DialogTitle>
          <DialogDescription>
            {state === 'active' && 'Answer all questions to test your understanding'}
            {state === 'result' && 'Quiz completed'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {state === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 space-y-4"
              >
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-sm text-muted-foreground">Preparing your quiz...</p>
              </motion.div>
            )}

            {/* Active State - Show Questions */}
            {state === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {questions.map((question, qIndex) => (
                  <div
                    key={question.id}
                    className="space-y-4 p-6 border border-zinc-200 rounded-lg bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0 text-sm">
                        {qIndex + 1}
                      </div>
                      <p className="text-base font-medium text-zinc-900 leading-relaxed">
                        {question.question}
                      </p>
                    </div>

                    <RadioGroup
                      value={answers[qIndex]?.toString() || ''}
                      onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                      className="space-y-3 ml-11"
                    >
                      {question.options.map((option, oIndex) => (
                        <div
                          key={oIndex}
                          className="flex items-center space-x-3 p-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                        >
                          <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                          <Label
                            htmlFor={`q${qIndex}-o${oIndex}`}
                            className="flex-1 cursor-pointer font-normal text-sm text-zinc-700"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered || isSubmitting}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Quiz
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Result State */}
            {state === 'result' && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8"
              >
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    {passed ? (
                      <div className="relative">
                        <Trophy className="h-24 w-24 text-green-600" />
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 10, 0] }}
                          transition={{ duration: 0.5, repeat: 2 }}
                          className="absolute inset-0"
                        >
                          <Trophy className="h-24 w-24 text-green-600" />
                        </motion.div>
                      </div>
                    ) : (
                      <XCircle className="h-24 w-24 text-red-600" />
                    )}
                  </motion.div>

                  {/* Score */}
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-bold text-zinc-900">
                      {passed ? 'Congratulations!' : 'Keep Trying!'}
                    </h3>
                    <p className="text-lg text-muted-foreground">
                      Your Score: <span className="font-semibold text-zinc-900">{score}%</span>
                    </p>
                  </div>

                  {/* Message */}
                  <div
                    className={`p-4 rounded-lg border-2 max-w-md text-center ${
                      passed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        passed ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {passed
                        ? `You've successfully mastered ${skillName}! The skill has been marked as completed.`
                        : `You scored ${score}%. You need at least 66% to pass. Review the material and try again.`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    {passed ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm text-muted-foreground"
                      >
                        Closing automatically...
                      </motion.div>
                    ) : (
                      <>
                        <Button variant="outline" onClick={onClose}>
                          Close
                        </Button>
                        <Button onClick={fetchQuiz}>
                          Try Again
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}
