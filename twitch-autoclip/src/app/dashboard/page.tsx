'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import Link from 'next/link'
import { Video, Scissors, Clock, CheckCircle, AlertCircle, Loader2, Plus, ExternalLink } from 'lucide-react'
import { formatDuration, formatRelativeTime, getStatusColor } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session } = useSession()

  if (!session) return null

  // In a real app, this would come from an API call
  const stats = {
    totalVods: 12,
    processingVods: 2,
    totalClips: 47,
    publishedClips: 34,
  }

  const recentVods = [
    {
      id: '1',
      title: 'Epic Gaming Session - Valorant Ranked',
      gameName: 'Valorant',
      status: 'PROCESSED' as const,
      duration: 7200,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      highlightsCount: 8,
      clipsCount: 5,
    },
    {
      id: '2',
      title: 'Just Chatting - Q&A with Community',
      gameName: 'Just Chatting',
      status: 'PROCESSING' as const,
      duration: 5400,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      highlightsCount: 0,
      clipsCount: 0,
    },
    {
      id: '3',
      title: 'Minecraft Hardcore - Day 100!',
      gameName: 'Minecraft',
      status: 'DOWNLOADED' as const,
      duration: 10800,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      highlightsCount: 12,
      clipsCount: 8,
    },
  ]

  const recentJobs = [
    { id: '1', type: 'HIGHLIGHT_DETECTION', status: 'RUNNING', progress: 65, vodTitle: 'Just Chatting - Q&A', createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    { id: '2', type: 'CLIP_GENERATION', status: 'COMPLETED', progress: 100, vodTitle: 'Valorant Ranked', createdAt: new Date(Date.now() - 30 * 60 * 1000) },
    { id: '3', type: 'VOD_DOWNLOAD', status: 'COMPLETED', progress: 100, vodTitle: 'Minecraft Hardcore', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session.user?.name || 'Streamer'}! Here's what's happening with your VODs.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vods">
            <Plus className="h-4 w-4 mr-2" />
            Import VOD
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total VODs" value={stats.totalVods} icon={Video} color="blue" />
        <StatCard title="Processing" value={stats.processingVods} icon={Loader2} color="yellow" />
        <StatCard title="Clips Created" value={stats.totalClips} icon={Scissors} color="purple" />
        <StatCard title="Published" value={stats.publishedClips} icon={CheckCircle} color="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent VODs</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/vods">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVods.map((vod) => (
                <VodRow key={vod.id} vod={vod} />
              ))}
              {recentVods.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No VODs imported yet</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/dashboard/vods">Import your first VOD</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/jobs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
              {recentJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent jobs</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/vods">
                <Plus className="h-4 w-4 mr-2" />
                Import New VOD
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/vods">
                <ExternalLink className="h-4 w-4 mr-2" />
                Browse VOD Library
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/clips">
                <Scissors className="h-4 w-4 mr-2" />
                View All Clips
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full', colors[color as keyof typeof colors])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VodRow({ vod }: { vod: any }) {
  const statusColors = {
    PROCESSED: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-yellow-100 text-yellow-800',
    DOWNLOADED: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-gray-100 text-gray-800',
    FAILED: 'bg-red-100 text-red-800',
  }

  return (
    <Link href={`/dashboard/vods/${vod.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Video className="h-8 w-8" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{vod.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{vod.gameName}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatDuration(vod.duration)}</span>
          <span>•</span>
          <span>{formatRelativeTime(vod.publishedAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={statusColors[vod.status as keyof typeof statusColors]}>
          {vod.status}
        </Badge>
        <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <Scissors className="h-3 w-3" />
          {vod.clipsCount}
        </div>
      </div>
    </Link>
  )
}

function JobRow({ job }: { job: any }) {
  const statusIcons = {
    RUNNING: <Loader2 className="h-4 w-4 animate-spin" />,
    COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
    FAILED: <AlertCircle className="h-4 w-4 text-red-500" />,
    PENDING: <Clock className="h-4 w-4 text-gray-400" />,
    CANCELLED: <AlertCircle className="h-4 w-4 text-gray-400" />,
  }

  const statusColors = {
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-shrink-0">{statusIcons[job.status as keyof typeof statusIcons]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">{job.type.replace(/_/g, ' ')}</p>
          <Badge variant="outline" className={statusColors[job.status as keyof typeof statusColors]}>
            {job.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.vodTitle}</p>
        {job.status === 'RUNNING' && (
          <Progress value={job.progress} className="mt-2 h-1" />
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {formatRelativeTime(job.createdAt)}
      </p>
    </div>
  )
}

import { cn } from '@/lib/utils'
import { Settings } from 'lucide-react'