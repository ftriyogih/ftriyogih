'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tv2, Zap, Scissors, Brain, Video } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv2 className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Twitch AutoClip</span>
            </div>
            <Button onClick={() => signIn('twitch')}>Sign in with Twitch</Button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
              Automatically create clips from your <span className="text-purple-600">Twitch VODs</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              AI-powered highlight detection analyzes chat activity, audio peaks, and stream markers to find the best moments. Review, customize, and publish clips in minutes.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => signIn('twitch')}>
                <Tv2 className="mr-2 h-5 w-5" />
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">How it works</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to turn your VODs into shareable clips
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Video className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-center">1. Import VODs</CardTitle>
                <CardDescription className="text-center">
                  Connect your Twitch account and import any VOD from your channel with one click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-center">2. AI Detects Highlights</CardTitle>
                <CardDescription className="text-center">
                  Our engine analyzes chat spikes, audio peaks, and stream markers to find exciting moments automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Scissors className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-center">3. Review & Publish</CardTitle>
                <CardDescription className="text-center">
                  Review suggested clips, adjust timestamps, add titles, and publish directly to Twitch.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 rounded-2xl mx-4 mt-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Features</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to create viral clips from your streams
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={Zap} title="Chat Activity Detection" description="Identifies moments with high chat engagement using z-score analysis" />
            <FeatureCard icon={Video} title="Audio Peak Analysis" description="Detects loud moments, cheers, and exciting audio cues automatically" />
            <FeatureCard icon={Brain} title="Stream Markers" description="Leverages your existing Twitch stream markers as highlight candidates" />
            <FeatureCard icon={Scissors} title="Custom Clip Editor" description="Fine-tune start/end times, add titles, and preview before publishing" />
          </div>
        </section>
      </main>

      <footer className="border-t bg-white/50 dark:bg-gray-900/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Twitch API, and AI highlight detection</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}