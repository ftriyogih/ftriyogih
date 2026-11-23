import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    DOWNLOADING: 'bg-blue-100 text-blue-800',
    DOWNLOADED: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    PROCESSED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    GENERATING: 'bg-blue-100 text-blue-800',
    READY: 'bg-green-100 text-green-800',
    PUBLISHING: 'bg-purple-100 text-purple-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getHighlightTypeColor(type: string): string {
  const colors: Record<string, string> = {
    CHAT_SPIKE: 'bg-blue-100 text-blue-800',
    AUDIO_PEAK: 'bg-purple-100 text-purple-800',
    STREAM_MARKER: 'bg-green-100 text-green-800',
    MANUAL: 'bg-gray-100 text-gray-800',
    COMBINED: 'bg-orange-100 text-orange-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}