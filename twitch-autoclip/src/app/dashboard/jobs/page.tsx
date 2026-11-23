'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { formatRelativeTime } from '@/lib/utils'
import { Loader2, CheckCircle, AlertCircle, Clock, XCircle, MoreHorizontal, Video, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'

const mockJobs = [
  { id: '1', type: 'HIGHLIGHT_DETECTION', status: 'RUNNING', progress: 65, vodId: '2', vodTitle: 'Just Chatting - Q&A with Community', createdAt: new Date(Date.now() - 10 * 60 * 1000), startedAt: new Date(Date.now() - 8 * 60 * 1000) },
  { id: '2', type: 'CLIP_GENERATION', status: 'COMPLETED', progress: 100, vodId: '1', vodTitle: 'Epic Gaming Session - Valorant Ranked', createdAt: new Date(Date.now() - 30 * 60 * 1000), startedAt: new Date(Date.now() - 28 * 60 * 1000), completedAt: new Date(Date.now() - 25 * 60 * 1000) },
  { id: '3', type: 'VOD_DOWNLOAD', status: 'COMPLETED', progress: 100, vodId: '3', vodTitle: 'Minecraft Hardcore - Day 100!', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1 * 60 * 1000), completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 6 * 60 * 1000) },
  { id: '4', type: 'CLIP_PUBLISH', status: 'FAILED', progress: 100, vodId: '1', vodTitle: 'Epic Gaming Session - Valorant Ranked', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 2 * 60 * 1000), completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 5 * 60 * 1000), errorMessage: 'Twitch API rate limit exceeded' },
  { id: '5', type: 'HIGHLIGHT_DETECTION', status: 'PENDING', progress: 0, vodId: '4', vodTitle: 'League of Legends - Climbing to Diamond', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
  { id: '6', type: 'VOD_DOWNLOAD', status: 'CANCELLED', progress: 45, vodId: '5', vodTitle: 'Apex Legends - Tournament Finals', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 1 * 60 * 1000), completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000 + 10 * 60 * 1000) },
]

const typeIcons = {
  VOD_DOWNLOAD: Video,
  HIGHLIGHT_DETECTION: RefreshCw,
  CLIP_GENERATION: Loader2,
  CLIP_PUBLISH: Loader2,
}

function TypeIcon({ type }: { type: string }) {
  const Icon = typeIcons[type as keyof typeof typeIcons] || Video
  return <Icon className="h-5 w-5 text-purple-600" />
}

const statusIcons = {
  PENDING: <Clock className="h-4 w-4 text-gray-400" />,
  RUNNING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
  FAILED: <AlertCircle className="h-4 w-4 text-red-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-gray-400" />,
}

export default function JobsPage() {
  const { data: session } = useSession()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  if (!session) return null

  const filteredJobs = mockJobs.filter((job) => {
    const matchesStatus = !statusFilter || job.status === statusFilter
    const matchesType = !typeFilter || job.type === typeFilter
    return matchesStatus && matchesType
  })

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'VOD_DOWNLOAD', label: 'VOD Download' },
    { value: 'HIGHLIGHT_DETECTION', label: 'Highlight Detection' },
    { value: 'CLIP_GENERATION', label: 'Clip Generation' },
    { value: 'CLIP_PUBLISH', label: 'Clip Publish' },
  ]

  const statusColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }

  const statusIcons = {
    PENDING: <Clock className="h-4 w-4 text-gray-400" />,
    RUNNING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
    FAILED: <AlertCircle className="h-4 w-4 text-red-500" />,
    CANCELLED: <XCircle className="h-4 w-4 text-gray-400" />,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor background processing jobs
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-[180px] h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-[200px] h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source VOD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon type={job.type} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/vods/${job.vodId}`} className="text-sm text-purple-600 hover:underline dark:text-purple-400">
                          {job.vodTitle}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={statusColors[job.status as keyof typeof statusColors]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[job.status as keyof typeof statusIcons] || <Clock className="h-4 w-4 text-gray-400" />}
                            {job.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <Progress value={job.progress} className="h-1.5" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">{job.progress}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {job.startedAt ? formatRelativeTime(job.startedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {job.completedAt ? formatRelativeTime(job.completedAt) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/vods/${job.vodId}`}>
                                <Video className="h-4 w-4 mr-2" />
                                View VOD
                              </Link>
                            </DropdownMenuItem>
                            {job.status === 'FAILED' && (
                              <>
                                <DropdownMenuItem>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Retry Job
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {job.status === 'PENDING' || job.status === 'RUNNING' ? (
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Job
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No jobs found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {statusFilter || typeFilter ? 'Try adjusting your filters' : 'Jobs will appear here when you import VODs or generate clips'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}