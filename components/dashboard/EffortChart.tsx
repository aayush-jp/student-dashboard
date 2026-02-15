'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Clock } from 'lucide-react'
import type { WeeklyEffortData } from '@/app/dashboard/actions'

interface EffortChartProps {
  data: WeeklyEffortData[]
}

export function EffortChart({ data }: EffortChartProps) {
  const hasData = data.length > 0
  const totalMinutes = data.reduce((sum, item) => sum + item.minutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Learning Velocity
            </CardTitle>
            <CardDescription>Your focus time over the last 7 days</CardDescription>
          </div>
          {hasData && (
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{totalHours}h</div>
              <div className="text-sm text-zinc-500">Total this week</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="skillName"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{
                    color: '#18181b',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}
                  formatter={(value) => {
                    const minutes = typeof value === 'number' ? value : 0
                    return [`${minutes} minutes`, 'Focus Time']
                  }}
                />
                <Bar
                  dataKey="minutes"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-zinc-100 p-6">
              <Clock className="h-12 w-12 text-zinc-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-900">No Focus Sessions Yet</h3>
              <p className="text-sm text-zinc-600 max-w-sm">
                Start tracking your learning time by using the Focus Timer when studying skills.
                Your progress will appear here!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
