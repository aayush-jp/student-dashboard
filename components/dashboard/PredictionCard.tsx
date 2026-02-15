'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { getCompletionPrediction, type GetCompletionPredictionResult } from '@/app/dashboard/actions'

export function PredictionCard() {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<GetCompletionPredictionResult | null>(null)

  useEffect(() => {
    fetchPrediction()
  }, [])

  const fetchPrediction = async () => {
    setLoading(true)
    try {
      const data = await getCompletionPrediction()
      setResult(data)
    } catch (error) {
      console.error('Error fetching prediction:', error)
      setResult({
        prediction: null,
        error: 'Failed to load prediction',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDaysUntil = (dateString: string) => {
    const target = new Date(dateString)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          Estimated Completion
        </CardTitle>
        <CardDescription>ML-powered prediction based on your study velocity</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your progress...</p>
          </div>
        ) : result?.error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-zinc-900">Prediction Unavailable</p>
              <p className="text-xs text-muted-foreground mt-1">{result.error}</p>
            </div>
          </div>
        ) : result?.prediction?.status === 'insufficient_data' ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900">Keep Studying to Unlock</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Complete at least 3 study sessions to unlock AI-powered completion predictions
              </p>
            </div>
          </div>
        ) : result?.prediction?.status === 'stalled' ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-base font-semibold text-zinc-900">Low Study Activity</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Increase your study frequency to generate accurate predictions
              </p>
            </div>
          </div>
        ) : result?.prediction?.status === 'success' && result.prediction.predicted_date ? (
          <div className="space-y-4">
            {/* Main Prediction */}
            <div className="text-center py-6 bg-linear-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <p className="text-sm text-muted-foreground mb-2">You'll complete on</p>
              <p className="text-3xl md:text-4xl font-bold text-purple-900 leading-tight">
                {formatDate(result.prediction.predicted_date)}
              </p>
              <p className="text-sm text-purple-700 mt-2">
                {getDaysUntil(result.prediction.predicted_date)} days from now
              </p>
            </div>

            {/* Velocity Info */}
            {result.prediction.velocity_hours_per_day !== undefined && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-zinc-600" />
                  <span className="text-sm text-zinc-700">Study Velocity</span>
                </div>
                <span className="text-sm font-semibold text-zinc-900">
                  {result.prediction.velocity_hours_per_day.toFixed(1)} hrs/day
                </span>
              </div>
            )}

            {/* Completion Message */}
            {result.prediction.message && (
              <p className="text-xs text-center text-muted-foreground italic">
                {result.prediction.message}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
            <AlertCircle className="h-8 w-8 text-zinc-400" />
            <p className="text-sm text-muted-foreground">No prediction available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
