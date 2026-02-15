'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { selectDomain } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Globe, BarChart, Code, Database, Brain, Palette, Loader2 } from 'lucide-react'
import type { Domain } from '@/types/database'

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  globe: Globe,
  'bar-chart': BarChart,
  code: Code,
  database: Database,
  brain: Brain,
  palette: Palette,
  'book-open': BookOpen,
}

interface DomainCardProps {
  domain: Domain
  isDisabled: boolean
  isLoading: boolean
  onClick: () => void
}

function DomainCard({ domain, isDisabled, isLoading, onClick }: DomainCardProps) {
  const IconComponent = domain.icon ? iconMap[domain.icon] || BookOpen : BookOpen

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full h-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Card
        className={`h-full transition-all duration-200 cursor-pointer group relative ${
          !isDisabled
            ? 'hover:shadow-lg hover:scale-105 hover:border-blue-400'
            : 'opacity-60'
        }`}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-sm text-zinc-600 font-medium">Selecting...</p>
            </div>
          </div>
        )}
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <IconComponent className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
            {domain.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {domain.description || 'Choose this path to begin your journey'}
          </CardDescription>
        </CardContent>
      </Card>
    </button>
  )
}

interface DomainGridProps {
  domains: Domain[]
}

export function DomainGrid({ domains }: DomainGridProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)

  const handleSelectDomain = (domainId: string) => {
    setSelectedDomainId(domainId)
    
    startTransition(async () => {
      const result = await selectDomain(domainId)
      
      if (result.success) {
        // Navigate to dashboard on success
        router.push('/dashboard')
      } else {
        // Handle error
        setSelectedDomainId(null)
        alert(`Error: ${result.error}\n\nPlease try again or contact support.`)
      }
    })
  }

  if (domains.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <p className="text-lg text-zinc-600">No domains available at the moment.</p>
          <p className="text-sm text-zinc-500">Please contact your administrator.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {domains.map((domain) => (
        <DomainCard
          key={domain.id}
          domain={domain}
          isDisabled={isPending}
          isLoading={isPending && selectedDomainId === domain.id}
          onClick={() => handleSelectDomain(domain.id)}
        />
      ))}
    </div>
  )
}
