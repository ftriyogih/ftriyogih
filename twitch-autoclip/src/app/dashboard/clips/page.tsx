'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { formatDuration, formatRelativeTime, getStatusColor } from '@/lib/utils'
import { Scissors, Download, ExternalLink, Trash2, MoreHorizontal, Play, CheckCircle, Loader2, AlertCircle, Video } from 'lucide-react'
import Link from 'next/link'

const mockClips = [
  {
    id: '1',
    title: 'Insane Ace Clutch!',
    vodId: '1',
    vodTitle: 'Epic Gaming Session - Valorant Ranked',
    startTime: 1230,
    endTime: 1350,
    duration: 120,
    status: 'PUBLISHED',
    localPath: '/tmp/clips/1.mp4',
    twitchClipId: 'abc123',
    url: 'https://clips.twitch.tv/abc123',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    highlight: { confidence: 0.92, type: 'CHAT_SPIKE' },
  },
  {
    id: '2',
    title: 'Funny Reaction Moment',
    vodId: '1',
    vodTitle: 'Epic Gaming Session - Valorant Ranked',
    startTime: 3420,
    endTime: 3480,
    duration: 60,
    status: 'READY',
    localPath: '/tmp/clips/2.mp4',
    twitchClipId: null,
    url: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    highlight: { confidence: 0.87, type: 'AUDIO_PEAK' },
  },
  {
    id: '3',
    title: 'Epic Clutch Play',
    vodId: '3',
    vodTitle: 'Minecraft Hardcore - Day 100!',
    startTime: 5600,
    endTime: 5720,
    duration: 120,
    status: 'GENERATING',
    localPath: null,
    twitchClipId: null,
    url: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    highlight: { confidence: 0.75, type: 'COMBINED' },
  },
  {
    id: '4',
    title: 'Stream Marker: "Epic clutch!"',
    vodId: '1',
    vodTitle: 'Epic Gaming Session - Valorant Ranked',
    startTime: 6100,
    endTime: 6180,
    duration: 80,
    status: 'FAILED',
    localPath: null,
    twitchClipId: null,
    url: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    highlight: { confidence: 0.68, type: 'STREAM_MARKER' },
    errorMessage: 'FFmpeg error: Invalid timestamp',
  },
]

export default function ClipsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  if (!session) return null

  const filteredClips = mockClips.filter((clip) => {
    const matchesSearch = clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.vodTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || clip.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'GENERATING', label: 'Generating' },
    { value: 'READY', label: 'Ready' },
    { value: 'PUBLISHING', label: 'Publishing' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'FAILED', label: 'Failed' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clips</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and publish your generated clips
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search clips by title or VOD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredClips.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source VOD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredClips.map((clip) => (
                    <tr key={clip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{clip.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/vods/${clip.vodId}`} className="text-sm text-purple-600 hover:underline dark:text-purple-400">
                          {clip.vodTitle}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {formatDuration(clip.duration)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {(clip.highlight.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getStatusColor(clip.status)}>
                          {clip.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(clip.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {clip.localPath && (
                              <>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Clip
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {clip.status === 'READY' && (
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Publish to Twitch
                              </DropdownMenuItem>
                            )}
                            {clip.status === 'PUBLISHED' && clip.url && (
                              <DropdownMenuItem asChild>
                                <a href={clip.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View on Twitch
                                </a>
                              </DropdownMenuItem>
                            )}
                            {clip.status === 'FAILED' && (
                              <>
                                <DropdownMenuItem>
                                  <Loader2 className="h-4 w-4 mr-2" />
                                  Retry Generation
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
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
              <Video className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No clips found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {searchQuery || statusFilter ? 'Try adjusting your search or filters' : 'Generate clips from your VOD highlights'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}