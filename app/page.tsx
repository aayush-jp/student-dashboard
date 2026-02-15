import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen,
  Brain,
  Award,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-zinc-900">Student Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <Zap className="h-4 w-4" />
              AI-Powered Learning Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto leading-tight">
              Master Skills with{' '}
              <span className="text-blue-600">Intelligent</span> Learning Paths
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              Track your progress, validate knowledge through interactive quizzes, and receive
              AI-powered recommendations to optimize your learning journey.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="text-base px-8">
                  Start Learning Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              A comprehensive learning management system designed for students who want to achieve
              mastery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Structured Roadmaps</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Follow carefully designed learning paths with prerequisite validation and
                  difficulty-based progression from Foundation to Advanced levels.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Interactive Quizzes</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Validate your knowledge with skill-specific quizzes. Pass with 66% or higher to
                  unlock completion badges and confetti celebrations.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">AI Learning Advisor</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Receive personalized recommendations based on your study patterns, detect
                  struggling areas, and get guidance on maintaining consistency.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Progress Analytics</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Track your learning velocity with beautiful charts showing time spent per skill,
                  completion rates, and weekly effort trends.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Focus Timer</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Built-in stopwatch to track study sessions. Log your time automatically and see
                  your dedication reflected in analytics.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-blue-200 transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Curated Resources</h3>
                <p className="text-zinc-600 leading-relaxed">
                  Access categorized learning materials including videos, articles, documentation,
                  and courses for each skill in your domain.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Your journey from beginner to mastery in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Choose Your Domain</h3>
              <p className="text-zinc-600 leading-relaxed">
                Select from curated learning domains like Full Stack Development, Data Science, or
                Mobile Development.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Follow the Roadmap</h3>
              <p className="text-zinc-600 leading-relaxed">
                Progress through Foundation, Core, and Advanced skills with guided prerequisites
                and tracked study sessions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Validate & Master</h3>
              <p className="text-zinc-600 leading-relaxed">
                Take interactive quizzes to prove your knowledge and earn completion badges as you
                master each skill.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">100+</div>
              <div className="text-blue-100 text-lg">Skills to Master</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">AI-Powered</div>
              <div className="text-blue-100 text-lg">Learning Insights</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold">Real-Time</div>
              <div className="text-blue-100 text-lg">Progress Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 border-blue-200 bg-linear-to-br from-blue-50 to-purple-50">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                Join today and experience a smarter way to learn. Track progress, validate
                knowledge, and achieve mastery with AI-powered guidance.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href="/login">
                  <Button size="lg" className="text-base px-8">
                    Get Started Free
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl text-center text-sm text-zinc-600">
          <p>© 2026 Student Dashboard. Built with Next.js, Supabase, and AI.</p>
        </div>
      </footer>
    </div>
  )
}
