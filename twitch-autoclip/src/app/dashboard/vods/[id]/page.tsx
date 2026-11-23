'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { formatDuration, formatRelativeTime, getStatusColor, getHighlightTypeColor } from '@/lib/utils'
import { Video, Scissors, Download, RefreshCw, Trash2, AlertCircle, Loader2, CheckCircle, Clock, MessageSquare, Volume2, Flag, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'

const mockVod = {
  id: '1',
  twitchVodId: '123456789',
  title: 'Epic Gaming Session - Valorant Ranked',
  gameName: 'Valorant',
  status: 'PROCESSED',
  duration: 7200,
  viewCount: 1250,
  publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  url: 'https://twitch.tv/videos/123456789',
  thumbnailUrl: 'https://static-cdn.jtvnw.net/ttv-boxart/Valorant-285x380.jpg',
  highlightsCount: 8,
  clipsCount: 5,
  localPath: '/tmp/vods/1.mp4',
}

const mockHighlights = [
  {
    id: '1',
    startTime: 1230,
    endTime: 1350,
    confidence: 0.92,
    type: 'CHAT_SPIKE',
    label: 'Chat spike: 245 msgs/min (3.2σ)',
    reviewed: true,
    approved: true,
    clips: [{ id: 'c1', status: 'PUBLISHED' }],
  },
  {
    id: '2',
    startTime: 3420,
    endTime: 3540,
    confidence: 0.87,
    type: 'AUDIO_PEAK',
    label: 'Audio peak: -2.1dB (2.8σ)',
    reviewed: true,
    approved: true,
    clips: [{ id: 'c2', status: 'READY' }],
  },
  {
    id: '3',
    startTime: 5600,
    endTime: 5720,
    confidence: 0.75,
    type: 'COMBINED',
    label: 'Combined highlight at 93:20-95:20 (120s)',
    reviewed: false,
    approved: null,
    clips: [],
  },
  {
    id: '4',
    startTime: 6100,
    endTime: 6180,
    confidence: 0.68,
    type: 'STREAM_MARKER',
    label: 'Stream marker: "Epic clutch!"',
    reviewed: true,
    approved: false,
    clips: [],
  },
]

const mockJobs = [
  { id: '1', type: 'VOD_DOWNLOAD', status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000) },
  { id: '2', type: 'HIGHLIGHT_DETECTION', status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000), completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000) },
  { id: '3', type: 'CLIP_GENERATION', status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000), completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20 * 60 * 1000) },
]

export default function VodDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')

  if (!session) return null

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white truncate">{mockVod.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <Video className="h-4 w-4" />
              {mockVod.gameName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(mockVod.duration)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              {formatRelativeTime(mockVod.publishedAt)}
            </span>
            <Badge variant="outline" className={getStatusColor(mockVod.status)}>
              {mockVod.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Video className="h-4 w-4 mr-2" />
                Download Video (MP4)
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Download Chat Log
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/vods/${params.id}/highlights`}>
              <Scissors className="h-4 w-4 mr-2" />
              View Highlights
            </Link>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reprocess
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="highlights">Highlights ({mockHighlights.length})</TabsTrigger>
          <TabsTrigger value="clips">Clips ({mockVod.clipsCount})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({mockJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Twitch VOD ID" value={mockVod.twitchVodId} />
                <InfoRow label="Views" value={mockVod.viewCount.toLocaleString()} />
                <InfoRow label="Published" value={formatRelativeTime(mockVod.publishedAt)} />
                <InfoRow label="Duration" value={formatDuration(mockVod.duration)} />
                <InfoRow label="Status" value={
                  <Badge variant="outline" className={getStatusColor(mockVod.status)}>
                    {mockVod.status}
                  </Badge>
                } />
                <InfoRow label="Local File" value={mockVod.localPath ? 'Available' : 'Not downloaded'} />
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {mockVod.thumbnailUrl ? (
                    <img
                      src={mockVod.thumbnailUrl}
                      alt={mockVod.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {mockVod.thumbnailUrl ? 'Click to open on Twitch' : 'No thumbnail available'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <StatBox label="Highlights Found" value={mockHighlights.length} icon={Flag} color="purple" />
                <StatBox label="Approved" value={mockHighlights.filter(h => h.approved).length} icon={CheckCircle} color="green" />
                <StatBox label="Pending Review" value={mockHighlights.filter(h => !h.reviewed).length} icon={Clock} color="yellow" />
                <StatBox label="Clips Generated" value={mockVod.clipsCount} icon={Scissors} color="blue" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full justify-start">
                  <Link href={`/dashboard/vods/${params.id}/highlights`}>
                    <Flag className="h-4 w-4 mr-2" />
                    Review Highlights
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href={mockVod.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open on Twitch
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Detect Highlights
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="highlights">
          <div className="space-y-4">
            {mockHighlights.map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} vodId={params.id as string} />
            ))}
            {mockHighlights.length === 0 && (
              <div className="text-center py-12">
                <Flag className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No highlights detected</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Run highlight detection to find exciting moments</p>
                <Button className="mt-4">
                  <Loader2 className="h-4 w-4 mr-2" />
                  Detect Highlights
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clips">
          <div className="text-center py-12">
            <Scissors className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No clips yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Generate clips from approved highlights</p>
            <Button asChild className="mt-4">
              <Link href={`/dashboard/vods/${params.id}/highlights`}>
                <Flag className="h-4 w-4 mr-2" />
                Review Highlights First
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            {mockJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const colors = {
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={cn('p-2 rounded-full', colors[color as keyof typeof colors])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function HighlightCard({ highlight, vodId }: { highlight: any; vodId: string }) {
  const duration = highlight.endTime - highlight.startTime
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-24 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(highlight.startTime)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">→</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatTime(highlight.endTime)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ({duration}s)
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getHighlightTypeColor(highlight.type)}>
                {highlight.type}
              </Badge>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {(highlight.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{highlight.label}</p>
            <div className="flex items-center gap-2 mt-2">
              {highlight.reviewed ? (
                highlight.approved ? (
                  <Badge variant="success">Approved</Badge>
                ) : (
                  <Badge variant="destructive">Rejected</Badge>
                )
              ) : (
                <Badge variant="warning">Pending Review</Badge>
              )}
              {highlight.clips.length > 0 && (
                <Badge variant="outline">{highlight.clips[0].status}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/vods/${vodId}/highlights/${highlight.id}`}>
                <Flag className="h-4 w-4 mr-1" />
                Review
              </Link>
            </Button>
            {highlight.approved && highlight.clips.length === 0 && (
              <Button size="sm" asChild>
                <Link href={`/dashboard/vods/${vodId}/highlights/${highlight.id}?action=generate`}>
                  <Scissors className="h-4 w-4 mr-1" />
                  Create Clip
                </Link>
              </Button>
            )}
            {highlight.clips.length > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/clips/${highlight.clips[0].id}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Clip
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function JobCard({ job }: { job: any }) {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{statusIcons[job.status as keyof typeof statusIcons]}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {job.type.replace(/_/g, ' ')}
              </span>
              <Badge variant="outline" className={statusColors[job.status as keyof typeof statusColors]}>
                {job.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Started: {formatTime(new Date(job.createdAt))}</span>
              {job.completedAt && <span>Completed: {formatTime(new Date(job.completedAt))}</span>}
              {job.progress < 100 && job.status === 'RUNNING' && (
                <span>{job.progress}%</span>
              )}
            </div>
            {job.status === 'RUNNING' && (
              <Progress value={job.progress} className="mt-2 h-1" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

import { cn } from '@/lib/utils'