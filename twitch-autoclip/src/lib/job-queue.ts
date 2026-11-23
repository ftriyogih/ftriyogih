import { prisma } from './prisma'
import { downloadVod, createClip, getVideoInfo } from './video'
import { createTwitchClient, TwitchApiClient } from './twitch'
import { detectHighlights, HighlightCandidate } from './highlights'
import { JobType, JobStatus, VodStatus, ClipStatus, Prisma } from '@prisma/client'

type JobHandler = (job: { id: string; payload: any; userId: string }) => Promise<any>

const handlers: Record<JobType, JobHandler> = {
  VOD_DOWNLOAD: handleVodDownload,
  HIGHLIGHT_DETECTION: handleHighlightDetection,
  CLIP_GENERATION: handleClipGeneration,
  CLIP_PUBLISH: handleClipPublish,
}

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_JOBS || '2')
let runningJobs = 0

export async function processJobQueue() {
  if (runningJobs >= MAX_CONCURRENT) return
  
  const job = await prisma.job.findFirst({
    where: {
      status: 'PENDING',
    },
    orderBy: { createdAt: 'asc' },
  })
  
  if (!job) return
  
  runningJobs++
  await runJob(job)
  runningJobs--
  
  // Process next job
  setImmediate(() => processJobQueue())
}

async function runJob(job: any) {
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'RUNNING', startedAt: new Date(), progress: 0 },
  })
  
  try {
    const handler = handlers[job.type as JobType]
    if (!handler) {
      throw new Error(`No handler for job type: ${job.type}`)
    }
    
    const result = await handler({
      id: job.id,
      payload: job.payload,
      userId: job.userId,
    })
    
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        result: result as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    })
  } catch (error) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    })
  }
}

async function handleVodDownload({ payload, userId }: { payload: any; userId: string }) {
  const { vodId, vodUrl } = payload
  
  const vod = await prisma.vod.findUnique({ where: { id: vodId } })
  if (!vod) throw new Error('VOD not found')
  
  await prisma.vod.update({
    where: { id: vodId },
    data: { status: 'DOWNLOADING' },
  })
  
  const outputPath = `/tmp/vods/${vodId}.mp4`
  
  await downloadVod(vodUrl, outputPath, {
    onProgress: async (progress) => {
      await prisma.job.update({
        where: { id: payload.jobId },
        data: { progress: Math.round(progress * 0.8) }, // 80% for download
      })
    },
  })
  
  const info = await getVideoInfo(outputPath)
  
  await prisma.vod.update({
    where: { id: vodId },
    data: {
      status: 'DOWNLOADED',
      localPath: outputPath,
      duration: Math.round(info.duration),
    },
  })
  
  // Create highlight detection job
  await prisma.job.create({
    data: {
      userId,
      vodId,
      type: 'HIGHLIGHT_DETECTION',
      payload: { vodId },
    },
  })
  
  return { vodId, path: outputPath, duration: info.duration }
}

async function handleHighlightDetection({ payload, userId }: { payload: any; userId: string }) {
  const { vodId } = payload
  
  const vod = await prisma.vod.findUnique({ where: { id: vodId } })
  if (!vod || !vod.localPath) throw new Error('VOD not downloaded')
  
  await prisma.vod.update({
    where: { id: vodId },
    data: { status: 'PROCESSING' },
  })
  
  // Get chat replay from Twitch
  const client = await createTwitchClient(userId)
  const allComments: any[] = []
  let cursor: string | undefined
  
  do {
    const response = await client.getChatReplay(vod.twitchVodId, cursor)
    allComments.push(...response.data)
    cursor = response.pagination?.cursor
    
    await prisma.job.update({
      where: { id: payload.jobId },
      data: { progress: 10 + Math.min(allComments.length / 100, 40) },
    })
  } while (cursor)
  
  // Get stream markers
  let streamMarkers: Array<{ description: string; position_seconds: number }> = []
  try {
    const markersResponse = await client.getStreamMarkers(vod.userId)
    streamMarkers = markersResponse.data?.map((m: any) => ({
      description: m.description || 'Stream marker',
      position_seconds: m.position_seconds,
    })) || []
  } catch (e) {
    console.warn('Could not fetch stream markers:', e)
  }
  
  await prisma.job.update({
    where: { id: payload.jobId },
    data: { progress: 60 },
  })
  
  // Detect highlights
  const highlights = await detectHighlights(
    vod.localPath,
    allComments,
    vod.duration,
    streamMarkers
  )
  
  await prisma.job.update({
    where: { id: payload.jobId },
    data: { progress: 80 },
  })
  
  // Save highlights
  for (const highlight of highlights) {
    await prisma.highlight.create({
      data: {
        vodId,
        startTime: highlight.startTime,
        endTime: highlight.endTime,
        confidence: highlight.confidence,
        type: highlight.type,
        metadata: highlight.metadata as Prisma.InputJsonValue,
        label: highlight.label,
      },
    })
  }
  
  await prisma.vod.update({
    where: { id: vodId },
    data: { status: 'PROCESSED' },
  })
  
  return { highlightsFound: highlights.length }
}

async function handleClipGeneration({ payload, userId }: { payload: any; userId: string }) {
  const { highlightId, clipTitle } = payload
  
  const highlight = await prisma.highlight.findUnique({
    where: { id: highlightId },
    include: { vod: true },
  })
  
  if (!highlight || !highlight.vod.localPath) {
    throw new Error('Highlight or VOD not found')
  }
  
  const clip = await prisma.clip.create({
    data: {
      vodId: highlight.vodId,
      userId,
      highlightId,
      title: clipTitle || highlight.label,
      startTime: highlight.startTime,
      endTime: highlight.endTime,
      duration: highlight.endTime - highlight.startTime,
      status: 'GENERATING',
    },
  })
  
  const outputPath = `/tmp/clips/${clip.id}.mp4`
  
  await createClip({
    inputPath: highlight.vod.localPath,
    outputPath,
    startTime: highlight.startTime,
    endTime: highlight.endTime,
  })
  
  await prisma.clip.update({
    where: { id: clip.id },
    data: {
      status: 'READY',
      localPath: outputPath,
      completedAt: new Date(),
    },
  })
  
  return { clipId: clip.id, path: outputPath }
}

async function handleClipPublish({ payload, userId }: { payload: any; userId: string }) {
  const { clipId } = payload
  
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    include: { vod: true },
  })
  
  if (!clip || !clip.localPath) {
    throw new Error('Clip not found or not generated')
  }
  
  await prisma.clip.update({
    where: { id: clipId },
    data: { status: 'PUBLISHING' },
  })
  
  const client = await createTwitchClient(userId)
  const result = await client.createClip(clip.vod.userId)
  
  await prisma.clip.update({
    where: { id: clipId },
    data: {
      status: 'PUBLISHED',
      url: `https://clips.twitch.tv/${result.id}`,
      twitchClipId: result.id,
    },
  })
  
  return { clipId, twitchUrl: `https://clips.twitch.tv/${result.id}` }
}

export async function enqueueJob(
  userId: string,
  type: JobType,
  payload: any,
  vodId?: string
) {
  const job = await prisma.job.create({
    data: {
      userId,
      vodId,
      type,
      payload: payload as Prisma.InputJsonValue,
    },
  })
  
  // Trigger queue processing
  setImmediate(() => processJobQueue())
  
  return job
}

export async function getJobStatus(jobId: string) {
  return prisma.job.findUnique({ where: { id: jobId } })
}

export async function cancelJob(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: { status: 'CANCELLED' },
  })
}