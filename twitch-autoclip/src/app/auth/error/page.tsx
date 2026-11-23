'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function AuthErrorPageContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Configuration Error',
      description: 'There is a problem with the server configuration. Please contact the administrator.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You denied access to your Twitch account. Please try again and grant the required permissions.',
    },
    Verification: {
      title: 'Verification Failed',
      description: 'The authentication verification failed. This might be a temporary issue.',
    },
    OAuthSignin: {
      title: 'Sign In Failed',
      description: 'Failed to sign in with Twitch. Please try again.',
    },
    Callback: {
      title: 'Callback Error',
      description: 'An error occurred during the authentication callback. Please try signing in again.',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'The OAuth callback failed. Please try signing in again.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Failed',
      description: 'Failed to create your account. Please try again.',
    },
    EmailCreateAccount: {
      title: 'Email Account Creation Failed',
      description: 'Failed to create account with email. Please try again.',
    },
    CredentialsSignin: {
      title: 'Credentials Sign In Failed',
      description: 'Sign in with credentials failed. Please check your credentials.',
    },
    SessionRequired: {
      title: 'Session Required',
      description: 'Please sign in to access this page.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication. Please try again.',
    },
  }

  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle>{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.location.href = '/auth/signin'}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </a>
            </Button>
          </div>

          {error && (
            <details className="text-sm text-gray-500 dark:text-gray-400">
              <summary className="cursor-pointer mb-1">Error Details</summary>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
                {error}
              </pre>
            </details>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            If this problem persists, please{' '}
            <a href="https://github.com/your-repo/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-600">
              report an issue
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>}>
      <AuthErrorPageContent />
    </Suspense>
  )
}