'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Video, Loader2, CheckCircle, AlertCircle, Search, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ImportVodPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [vodUrl, setVodUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [vodInfo, setVodInfo] = useState<{
    id: string
    title: string
    gameName: string
    duration: number
    thumbnailUrl: string
    viewCount: number
  } | null>(null)

  if (!session) return null

  const extractVodId = (url: string): string | null => {
    const patterns = [
      /twitch\.tv\/videos\/(\d+)/,
      /twitch\.tv\/\w+\/videos\/(\d+)/,
      /clips\.twitch\.tv\/(\w+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const validateUrl = async () => {
    const id = extractVodId(vodUrl)
    if (!id) {
      setError('Invalid Twitch VOD URL. Please use a URL like: https://twitch.tv/videos/123456789')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call to fetch VOD info
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock response
      setVodInfo({
        id,
        title: 'Epic Gaming Session - Valorant Ranked',
        gameName: 'Valorant',
        duration: 7200,
        thumbnailUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/Valorant-285x380.jpg',
        viewCount: 1250,
      })
      setError('')
    } catch (err) {
      setError('Failed to fetch VOD info. Make sure the VOD is public and accessible.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    if (!vodInfo) return

    setIsLoading(true)
    setError('')

    try {
      // Simulate API call to import VOD
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Redirect to VOD detail page
      router.push('/dashboard/vods/1')
      router.refresh()
    } catch (err) {
      setError('Failed to import VOD. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import VOD</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Enter a Twitch VOD URL to import it for highlight detection and clip creation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>VOD URL</CardTitle>
          <CardDescription>
            Paste a Twitch VOD URL below. We'll fetch the video details and prepare it for processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="https://twitch.tv/videos/123456789"
                value={vodUrl}
                onChange={(e) => {
                  setVodUrl(e.target.value)
                  setVodInfo(null)
                  setError('')
                }}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={validateUrl}
              disabled={isLoading || !vodUrl.trim()}
            >
              {isLoading && !vodInfo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Check
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {vodInfo && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 animate-fade-in">
              <div className="flex gap-4">
                <div className="relative w-64 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {vodInfo.thumbnailUrl ? (
                    <img
                      src={vodInfo.thumbnailUrl}
                      alt={vodInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-12 w-12 text-gray-400 mx-auto my-auto" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{vodInfo.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      {vodInfo.gameName}
                    </span>
                    <span className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      {formatDuration(vodInfo.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {vodInfo.viewCount.toLocaleString()} views
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Import VOD
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported URL Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">https://twitch.tv/videos/123456789</code>
            </li>
            <li className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">https://twitch.tv/username/videos/123456789</code>
            </li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Note: VODs must be public and accessible. Subscriber-only or deleted VODs cannot be imported.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/vods">
            ← Back to VOD Library
          </Link>
        </Button>
      </div>
    </div>
  )
}