'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle, Info, Sparkles, Brain } from 'lucide-react'
import type { Recommendation } from '@/app/dashboard/actions'

interface AIAdvisorProps {
  recommendations: Recommendation[]
}

export function AIAdvisor({ recommendations }: AIAdvisorProps) {
  const hasRecommendations = recommendations.length > 0

  const iconMap = {
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  const colorMap = {
    warning: 'bg-amber-50 border-amber-300',
    success: 'bg-green-50 border-green-300',
    info: 'bg-blue-50 border-blue-300',
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Learning Advisor
        </CardTitle>
        <CardDescription>
          Personalized insights powered by your learning patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasRecommendations ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                variants={item}
                className={`p-4 rounded-lg border-2 ${colorMap[rec.type]} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{iconMap[rec.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-900 leading-relaxed font-medium">
                      {rec.message}
                    </p>
                    {rec.skillName && (
                      <p className="text-xs text-zinc-600 mt-1">
                        Skill: <span className="font-medium">{rec.skillName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 space-y-4"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="h-16 w-16 text-purple-400" />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-400 opacity-20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-900">
                Analyzing your learning patterns...
              </h3>
              <p className="text-sm text-zinc-600 max-w-sm mx-auto">
                Keep studying and logging focus sessions! Your personalized insights will appear here
                as we gather more data about your learning style.
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
