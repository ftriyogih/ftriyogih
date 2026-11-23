import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { spawn } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

ffmpeg.setFfmpegPath(ffmpegStatic!)

export interface VideoInfo {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  format: string
}

export interface ClipOptions {
  inputPath: string
  outputPath: string
  startTime: number
  endTime: number
  crf?: number
  preset?: string
}

export async function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err)
        return
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video')
      const format = metadata.format
      
      resolve({
        duration: format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        fps: videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : 0,
        bitrate: format.bit_rate || 0,
        format: format.format_name || '',
      })
    })
  })
}

export async function downloadVod(vodUrl: string, outputPath: string, options?: {
  quality?: string
  onProgress?: (progress: number) => void
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      vodUrl,
      '-o', outputPath,
      '-f', options?.quality || 'best[height<=1080]',
      '--no-playlist',
      '--progress',
      '--newline',
    ]
    
    const process = spawn('yt-dlp', args)
    
    process.stdout.on('data', (data) => {
      const output = data.toString()
      if (options?.onProgress) {
        const match = output.match(/(\d+\.?\d*)%/)
        if (match) {
          options.onProgress(parseFloat(match[1]))
        }
      }
    })
    
    process.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`)
    })
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`))
      }
    })
    
    process.on('error', (err) => {
      reject(err)
    })
  })
}

export async function createClip(options: ClipOptions): Promise<void> {
  const { inputPath, outputPath, startTime, endTime, crf = 23, preset = 'medium' } = options
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime - startTime)
      .outputOptions([
        '-c:v libx264',
        `-crf ${crf}`,
        `-preset ${preset}`,
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-avoid_negative_ts make_zero',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })
}

export async function extractAudio(inputPath: string, outputPath: string, options?: {
  sampleRate?: number
  channels?: number
}): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioFrequency(options?.sampleRate || 16000)
      .audioChannels(options?.channels || 1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run()
  })
}

export async function getAudioLevels(inputPath: string, interval = 1): Promise<Array<{ time: number; level: number }>> {
  return new Promise((resolve, reject) => {
    const levels: Array<{ time: number; level: number }> = []
    
    ffmpeg(inputPath)
      .audioFilter(`astats=metadata=1:reset=${interval},ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-`)
      .format('null')
      .output('-')
      .on('stderr', (stderr) => {
        const lines = stderr.toString().split('\n')
        for (const line of lines) {
          const match = line.match(/lavfi\.astats\.Overall\.RMS_level=(-?\d+\.?\d*)/)
          if (match) {
            levels.push({
              time: levels.length * interval,
              level: parseFloat(match[1]),
            })
          }
        }
      })
      .on('end', () => resolve(levels))
      .on('error', (err) => reject(err))
      .run()
  })
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

export function parseDuration(duration: string): number {
  // Parse Twitch duration format (e.g., "1h30m45s", "45m30s", "30s")
  const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/
  const match = duration.match(regex)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}