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

  const clip = await prisma.clip.findFirst({
    where: { id, userId: user.id },
    include: {
      vod: {
        select: { id: true, title: true, twitchVodId: true },
      },
      highlight: {
        select: { id: true, label: true, confidence: true },
      },
    },
  })

  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  return NextResponse.json({ clip })
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

  const clip = await prisma.clip.findFirst({
    where: { id, userId: user.id },
    include: { vod: true },
  })

  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  const body = await request.json()
  const { action } = body

  if (action === 'publish') {
    if (clip.status !== 'READY') {
      return NextResponse.json({ error: 'Clip must be ready to publish' }, { status: 400 })
    }

    await enqueueJob(user.id, 'CLIP_PUBLISH', { clipId: clip.id })

    return NextResponse.json({ message: 'Clip publishing started' })
  }

  if (action === 'regenerate') {
    if (!clip.vod.localPath) {
      return NextResponse.json({ error: 'VOD not downloaded' }, { status: 400 })
    }

    await prisma.clip.update({
      where: { id: clip.id },
      data: { status: 'GENERATING' },
    })

    await enqueueJob(user.id, 'CLIP_GENERATION', { 
      highlightId: clip.highlightId!, 
      clipTitle: clip.title 
    })

    return NextResponse.json({ message: 'Clip regeneration started' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

  const clip = await prisma.clip.findFirst({
    where: { id, userId: user.id },
  })

  if (!clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  await prisma.clip.delete({ where: { id } })

  return NextResponse.json({ message: 'Clip deleted' })
}