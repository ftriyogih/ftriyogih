import { TwitchVideoComment } from './twitch'
import { getAudioLevels } from './video'

export interface ChatMessage {
  time: number
  userId: string
  userName: string
  message: string
  emotes: string[]
  isCheer: boolean
  bits?: number
}

export interface ChatWindow {
  startTime: number
  endTime: number
  messageCount: number
  uniqueUsers: number
  emoteCount: number
  cheerCount: number
  totalBits: number
  messagesPerMinute: number
  zScore: number
}

export interface AudioPeak {
  time: number
  level: number
  zScore: number
}

export interface HighlightCandidate {
  startTime: number
  endTime: number
  confidence: number
  type: 'CHAT_SPIKE' | 'AUDIO_PEAK' | 'STREAM_MARKER' | 'COMBINED'
  metadata: {
    chatWindow?: ChatWindow
    audioPeak?: AudioPeak
    streamMarker?: { description: string; position: number }
  }
  label: string
}

const WINDOW_SIZE = 30 // seconds
const STEP_SIZE = 5 // seconds
const MIN_MESSAGES_PER_MINUTE = 10
const Z_SCORE_THRESHOLD = 2.0

function parseChatComments(comments: TwitchVideoComment[]): ChatMessage[] {
  return comments.map(comment => ({
    time: comment.content_offset_seconds,
    userId: comment.commenter.user_id,
    userName: comment.commenter.user_name,
    message: comment.message.body,
    emotes: comment.message.fragments
      .filter(f => f.type === 'emote')
      .map(f => f.emote?.name || ''),
    isCheer: comment.message.fragments.some(f => f.type === 'cheermote'),
    bits: comment.message.fragments
      .filter(f => f.type === 'cheermote')
      .reduce((sum, f) => sum + (f.cheermote?.bits || 0), 0),
  }))
}

function calculateChatWindows(messages: ChatMessage[], vodDuration: number): ChatWindow[] {
  const windows: ChatWindow[] = []
  
  for (let start = 0; start < vodDuration; start += STEP_SIZE) {
    const end = Math.min(start + WINDOW_SIZE, vodDuration)
    const windowMessages = messages.filter(m => m.time >= start && m.time < end)
    
    if (windowMessages.length === 0) continue
    
    const uniqueUsers = new Set(windowMessages.map(m => m.userId)).size
    const emoteCount = windowMessages.reduce((sum, m) => sum + m.emotes.length, 0)
    const cheerCount = windowMessages.filter(m => m.isCheer).length
    const totalBits = windowMessages.reduce((sum, m) => sum + (m.bits || 0), 0)
    const messagesPerMinute = (windowMessages.length / WINDOW_SIZE) * 60
    
    windows.push({
      startTime: start,
      endTime: end,
      messageCount: windowMessages.length,
      uniqueUsers,
      emoteCount,
      cheerCount,
      totalBits,
      messagesPerMinute,
      zScore: 0, // Will be calculated after
    })
  }
  
  // Calculate z-scores
  const mpms = windows.map(w => w.messagesPerMinute)
  const mean = mpms.reduce((a, b) => a + b, 0) / mpms.length
  const std = Math.sqrt(mpms.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / mpms.length)
  
  for (const window of windows) {
    window.zScore = std > 0 ? (window.messagesPerMinute - mean) / std : 0
  }
  
  return windows
}

function detectChatSpikes(windows: ChatWindow[]): HighlightCandidate[] {
  const highlights: HighlightCandidate[] = []
  
  for (const window of windows) {
    if (window.zScore >= Z_SCORE_THRESHOLD && window.messagesPerMinute >= MIN_MESSAGES_PER_MINUTE) {
      // Extend window slightly for context
      const startTime = Math.max(0, window.startTime - 5)
      const endTime = window.endTime + 5
      
      highlights.push({
        startTime,
        endTime,
        confidence: Math.min(window.zScore / 5, 1), // Normalize to 0-1
        type: 'CHAT_SPIKE',
        metadata: { chatWindow: window },
        label: `Chat spike: ${window.messageCount} msgs/min (${window.zScore.toFixed(1)}σ)`,
      })
    }
  }
  
  return highlights
}

function detectAudioPeaks(audioLevels: Array<{ time: number; level: number }>): HighlightCandidate[] {
  if (audioLevels.length === 0) return []
  
  const levels = audioLevels.map(a => a.level)
  const mean = levels.reduce((a, b) => a + b, 0) / levels.length
  const std = Math.sqrt(levels.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / levels.length)
  
  const highlights: HighlightCandidate[] = []
  
  for (const audio of audioLevels) {
    const zScore = std > 0 ? (audio.level - mean) / std : 0
    
    if (zScore >= Z_SCORE_THRESHOLD) {
      highlights.push({
        startTime: Math.max(0, audio.time - 3),
        endTime: audio.time + 3,
        confidence: Math.min(zScore / 5, 1),
        type: 'AUDIO_PEAK',
        metadata: { audioPeak: { ...audio, zScore } },
        label: `Audio peak: ${audio.level.toFixed(1)}dB (${zScore.toFixed(1)}σ)`,
      })
    }
  }
  
  return highlights
}

function mergeOverlappingHighlights(highlights: HighlightCandidate[], maxGap = 10): HighlightCandidate[] {
  if (highlights.length === 0) return []
  
  // Sort by start time
  highlights.sort((a, b) => a.startTime - b.startTime)
  
  const merged: HighlightCandidate[] = []
  let current = { ...highlights[0] }
  
  for (let i = 1; i < highlights.length; i++) {
    const next = highlights[i]
    
    if (next.startTime - current.endTime <= maxGap) {
      // Merge
      current.endTime = Math.max(current.endTime, next.endTime)
      current.confidence = Math.max(current.confidence, next.confidence)
      current.type = 'COMBINED'
      current.metadata = {
        ...current.metadata,
        ...next.metadata,
      }
      current.label = `${current.label} + ${next.label}`
    } else {
      merged.push(current)
      current = { ...next }
    }
  }
  
  merged.push(current)
  return merged
}

export async function detectHighlights(
  vodPath: string,
  chatComments: TwitchVideoComment[],
  vodDuration: number,
  streamMarkers?: Array<{ description: string; position_seconds: number }>
): Promise<HighlightCandidate[]> {
  // Parse chat messages
  const messages = parseChatComments(chatComments)
  
  // Calculate chat windows and detect spikes
  const windows = calculateChatWindows(messages, vodDuration)
  const chatHighlights = detectChatSpikes(windows)
  
  // Extract audio and detect peaks
  const audioLevels = await getAudioLevels(vodPath)
  const audioHighlights = detectAudioPeaks(audioLevels)
  
  // Process stream markers
  const markerHighlights: HighlightCandidate[] = (streamMarkers || []).map(marker => ({
    startTime: Math.max(0, marker.position_seconds - 15),
    endTime: marker.position_seconds + 15,
    confidence: 0.8,
    type: 'STREAM_MARKER' as const,
    metadata: { streamMarker: { description: marker.description, position: marker.position_seconds } },
    label: `Stream marker: ${marker.description}`,
  }))
  
  // Combine all highlights
  const allHighlights = [...chatHighlights, ...audioHighlights, ...markerHighlights]
  
  // Merge overlapping highlights
  const merged = mergeOverlappingHighlights(allHighlights)
  
  // Filter by minimum duration and confidence
  return merged.filter(h => 
    h.endTime - h.startTime >= 10 && 
    h.confidence >= 0.3
  )
}

export function generateHighlightLabel(highlight: HighlightCandidate): string {
  const start = formatTime(highlight.startTime)
  const end = formatTime(highlight.endTime)
  const duration = highlight.endTime - highlight.startTime
  
  switch (highlight.type) {
    case 'CHAT_SPIKE':
      return `💬 Chat spike at ${start}-${end} (${duration}s)`
    case 'AUDIO_PEAK':
      return `🔊 Audio peak at ${start}-${end} (${duration}s)`
    case 'STREAM_MARKER':
      return `📍 Marker at ${start}-${end} (${duration}s)`
    case 'COMBINED':
      return `✨ Combined highlight at ${start}-${end} (${duration}s)`
    default:
      return `Highlight at ${start}-${end} (${duration}s)`
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}