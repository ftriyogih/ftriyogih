import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createTwitchClient } from '@/lib/twitch'
import { enqueueJob } from '@/lib/job-queue'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { twitchId: session.user.twitchId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const vods = await prisma.vod.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      _count: {
        select: { highlights: true, clips: true },
      },
    },
  })

  const total = await prisma.vod.count({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : {}),
    },
  })

  return NextResponse.json({
    vods,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { twitchId: session.user.twitchId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { twitchVodId } = body

    if (!twitchVodId) {
      return NextResponse.json({ error: 'twitchVodId is required' }, { status: 400 })
    }

    // Check if VOD already exists
    const existingVod = await prisma.vod.findUnique({
      where: { twitchVodId },
    })

    if (existingVod) {
      return NextResponse.json({ vod: existingVod, message: 'VOD already imported' })
    }

    // Fetch VOD details from Twitch
    const client = await createTwitchClient(user.id)
    const vodData = await client.getVod(twitchVodId)

    if (!vodData) {
      return NextResponse.json({ error: 'VOD not found on Twitch' }, { status: 404 })
    }

    // Parse duration
    const duration = parseTwitchDuration(vodData.duration)

    // Create VOD record
    const vod = await prisma.vod.create({
      data: {
        twitchVodId: vodData.id,
        userId: user.id,
        title: vodData.title,
        description: vodData.description,
        gameName: vodData.game_name,
        language: vodData.language,
        duration,
        viewCount: vodData.view_count,
        publishedAt: new Date(vodData.published_at),
        url: vodData.url,
        thumbnailUrl: vodData.thumbnail_url,
        status: 'PENDING',
      },
    })

    // Enqueue download job
    await enqueueJob(user.id, 'VOD_DOWNLOAD', { vodId: vod.id, vodUrl: vodData.url }, vod.id)

    return NextResponse.json({ vod, message: 'VOD import started' })
  } catch (error) {
    console.error('Error importing VOD:', error)
    return NextResponse.json({ error: 'Failed to import VOD' }, { status: 500 })
  }
}

function parseTwitchDuration(duration: string): number {
  const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/
  const match = duration.match(regex)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}