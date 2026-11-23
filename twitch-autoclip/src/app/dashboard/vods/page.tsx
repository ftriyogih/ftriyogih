'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { formatDuration, formatRelativeTime, getStatusColor } from '@/lib/utils'
import { Plus, Search, Filter, MoreHorizontal, Download, Eye, Scissors, Trash2, RefreshCw, AlertCircle, Loader2, CheckCircle, Video } from 'lucide-react'
import Link from 'next/link'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DOWNLOADING', label: 'Downloading' },
  { value: 'DOWNLOADED', label: 'Downloaded' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PROCESSED', label: 'Processed' },
  { value: 'FAILED', label: 'Failed' },
]

const mockVods = [
  {
    id: '1',
    twitchVodId: '123456789',
    title: 'Epic Gaming Session - Valorant Ranked',
    gameName: 'Valorant',
    status: 'PROCESSED',
    duration: 7200,
    viewCount: 1250,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    highlightsCount: 8,
    clipsCount: 5,
    localPath: '/tmp/vods/1.mp4',
  },
  {
    id: '2',
    twitchVodId: '123456790',
    title: 'Just Chatting - Q&A with Community',
    gameName: 'Just Chatting',
    status: 'PROCESSING',
    duration: 5400,
    viewCount: 890,
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    highlightsCount: 0,
    clipsCount: 0,
    localPath: '/tmp/vods/2.mp4',
  },
  {
    id: '3',
    twitchVodId: '123456791',
    title: 'Minecraft Hardcore - Day 100!',
    gameName: 'Minecraft',
    status: 'DOWNLOADED',
    duration: 10800,
    viewCount: 2100,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    highlightsCount: 12,
    clipsCount: 8,
    localPath: '/tmp/vods/3.mp4',
  },
  {
    id: '4',
    twitchVodId: '123456792',
    title: 'League of Legends - Climbing to Diamond',
    gameName: 'League of Legends',
    status: 'PENDING',
    duration: 6600,
    viewCount: 0,
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    highlightsCount: 0,
    clipsCount: 0,
    localPath: null,
  },
  {
    id: '5',
    twitchVodId: '123456793',
    title: 'Apex Legends - Tournament Finals',
    gameName: 'Apex Legends',
    status: 'FAILED',
    duration: 4200,
    viewCount: 3400,
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    highlightsCount: 0,
    clipsCount: 0,
    localPath: null,
    errorMessage: 'Download failed: VOD unavailable in region',
  },
]

export default function VodsPage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedVod, setSelectedVod] = useState<typeof mockVods[0] | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  if (!session) return null

  const filteredVods = mockVods.filter((vod) => {
    const matchesSearch = vod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vod.gameName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || vod.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAction = async (vodId: string, action: string) => {
    setActionLoading(vodId)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setActionLoading(null)
    alert(`${action} action triggered for VOD ${vodId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">VOD Library</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and process your Twitch VODs
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/vods/import">
            <Plus className="h-4 w-4 mr-2" />
            Import VOD
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search VODs by title or game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredVods.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">VOD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Game</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Published</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Highlights</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clips</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVods.map((vod) => (
                    <tr key={vod.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/vods/${vod.id}`} className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400">
                          {vod.title}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {vod.twitchVodId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {vod.gameName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getStatusColor(vod.status)}>
                          {vod.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {formatDuration(vod.duration)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(vod.publishedAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {vod.highlightsCount}
                      </td>
                      <td className="px-6 py-4 text-gray-900 dark:text-white">
                        {vod.clipsCount}
                      </td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === vod.id}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/vods/${vod.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {vod.status === 'PROCESSED' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/vods/${vod.id}/highlights`}>
                                  <Scissors className="h-4 w-4 mr-2" />
                                  View Highlights
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {vod.localPath && (
                              <DropdownMenuItem onClick={() => handleAction(vod.id, 'download')}>
                                <Download className="h-4 w-4 mr-2" />
                                Download Video
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {vod.status === 'PENDING' || vod.status === 'FAILED' ? (
                              <DropdownMenuItem onClick={() => handleAction(vod.id, 'reprocess')}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {vod.status === 'FAILED' ? 'Retry' : 'Process'}
                              </DropdownMenuItem>
                            ) : vod.status === 'DOWNLOADED' ? (
                              <DropdownMenuItem onClick={() => handleAction(vod.id, 'detect-highlights')}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Detect Highlights
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction(vod.id, 'delete')}
                              className="text-red-600 focus:text-red-600"
                              disabled={actionLoading === vod.id}
                            >
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No VODs found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {searchQuery || statusFilter ? 'Try adjusting your search or filters' : 'Import your first VOD to get started'}
              </p>
              {!searchQuery && !statusFilter && (
                <Button asChild className="mt-4">
                  <Link href="/dashboard/vods/import">
                    <Plus className="h-4 w-4 mr-2" />
                    Import VOD
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredVods.length === mockVods.length && mockVods.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" className="w-10">
            1
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}