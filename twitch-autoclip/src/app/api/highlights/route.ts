import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
  const vodId = searchParams.get('vodId')
  const reviewed = searchParams.get('reviewed')
  const approved = searchParams.get('approved')
  const minConfidence = parseFloat(searchParams.get('minConfidence') || '0')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const highlights = await prisma.highlight.findMany({
    where: {
      vod: { userId: user.id },
      ...(vodId ? { vodId } : {}),
      ...(reviewed !== null ? { reviewed: reviewed === 'true' } : {}),
      ...(approved !== null ? { approved: approved === 'true' ? true : approved === 'false' ? false : null } : {}),
      confidence: { gte: minConfidence },
    },
    orderBy: { confidence: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      vod: {
        select: { id: true, title: true, twitchVodId: true },
      },
      clips: true,
    },
  })

  const total = await prisma.highlight.count({
    where: {
      vod: { userId: user.id },
      ...(vodId ? { vodId } : {}),
      ...(reviewed !== null ? { reviewed: reviewed === 'true' } : {}),
      ...(approved !== null ? { approved: approved === 'true' ? true : approved === 'false' ? false : null } : {}),
      confidence: { gte: minConfidence },
    },
  })

  return NextResponse.json({
    highlights,
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

  const body = await request.json()
  const { vodId, startTime, endTime, label } = body

  if (!vodId || startTime === undefined || endTime === undefined) {
    return NextResponse.json({ error: 'vodId, startTime, and endTime are required' }, { status: 400 })
  }

  const vod = await prisma.vod.findFirst({
    where: { id: vodId, userId: user.id },
  })

  if (!vod) {
    return NextResponse.json({ error: 'VOD not found' }, { status: 404 })
  }

  const highlight = await prisma.highlight.create({
    data: {
      vodId,
      startTime,
      endTime,
      confidence: 1.0,
      type: 'MANUAL',
      label: label || `Manual highlight ${formatTime(startTime)}-${formatTime(endTime)}`,
      reviewed: true,
      approved: true,
    },
  })

  return NextResponse.json({ highlight })
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}