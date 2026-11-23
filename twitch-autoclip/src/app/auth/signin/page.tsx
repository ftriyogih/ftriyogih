'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Tv2, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function SignInPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
            <Tv2 className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle>Sign in to Twitch AutoClip</CardTitle>
          <CardDescription>
            Connect your Twitch account to start creating clips from your VODs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">
                {error === 'Callback' ? 'Authentication failed. Please try again.' : 'An error occurred during sign in.'}
              </span>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn('twitch', { callbackUrl })}
          >
            <Tv2 className="h-5 w-5 mr-2" />
            Continue with Twitch
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <a href="/terms" className="underline hover:text-purple-600">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-purple-600">Privacy Policy</a>
          </p>

          <div className="text-center text-xs text-gray-400 dark:text-gray-500">
            <p>Required permissions:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-left max-w-xs mx-auto">
              <li>Read your channel VODs</li>
              <li>Create and manage clips</li>
              <li>Read chat messages (for highlight detection)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <SignInPageContent />
    </Suspense>
  )
}