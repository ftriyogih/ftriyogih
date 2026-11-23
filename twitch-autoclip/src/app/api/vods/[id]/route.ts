import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enqueueJob } from '@/lib/job-queue'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { twitchId: session.user.twitchId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const vod = await prisma.vod.findFirst({
    where: { id, userId: user.id },
    include: {
      highlights: {
        orderBy: { startTime: 'asc' },
        include: { clips: true },
      },
      clips: {
        orderBy: { createdAt: 'desc' },
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!vod) {
    return NextResponse.json({ error: 'VOD not found' }, { status: 404 })
  }

  return NextResponse.json({ vod })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { twitchId: session.user.twitchId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const vod = await prisma.vod.findFirst({
    where: { id, userId: user.id },
  })

  if (!vod) {
    return NextResponse.json({ error: 'VOD not found' }, { status: 404 })
  }

  await prisma.vod.delete({ where: { id } })

  return NextResponse.json({ message: 'VOD deleted' })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.twitchId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { twitchId: session.user.twitchId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const vod = await prisma.vod.findFirst({
    where: { id, userId: user.id },
  })

  if (!vod) {
    return NextResponse.json({ error: 'VOD not found' }, { status: 404 })
  }

  const body = await request.json()
  const { action } = body

  if (action === 'reprocess') {
    // Reset VOD status and requeue
    await prisma.vod.update({
      where: { id },
      data: { status: 'PENDING' },
    })

    await prisma.highlight.deleteMany({ where: { vodId: id } })
    await prisma.clip.deleteMany({ where: { vodId: id } })

    await enqueueJob(user.id, 'VOD_DOWNLOAD', { vodId: id, vodUrl: vod.url }, id)

    return NextResponse.json({ message: 'Reprocessing started' })
  }

  if (action === 'detect-highlights') {
    if (vod.status !== 'DOWNLOADED' && vod.status !== 'PROCESSED') {
      return NextResponse.json({ error: 'VOD must be downloaded first' }, { status: 400 })
    }

    await enqueueJob(user.id, 'HIGHLIGHT_DETECTION', { vodId: id }, id)

    return NextResponse.json({ message: 'Highlight detection started' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}