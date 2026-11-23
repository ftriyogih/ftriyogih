import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enqueueJob } from '@/lib/job-queue'
import { NextRequest, NextResponse } from 'next/server'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export async function PATCH(
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

  const highlight = await prisma.highlight.findFirst({
    where: { id, vod: { userId: user.id } },
    include: { vod: true },
  })

  if (!highlight) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
  }

  const body = await request.json()
  const { approved, reviewed, startTime, endTime, label } = body

  const updateData: any = {}
  if (approved !== undefined) updateData.approved = approved
  if (reviewed !== undefined) updateData.reviewed = reviewed
  if (startTime !== undefined) updateData.startTime = startTime
  if (endTime !== undefined) updateData.endTime = endTime
  if (label !== undefined) updateData.label = label

  const updated = await prisma.highlight.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({ highlight: updated })
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

  const highlight = await prisma.highlight.findFirst({
    where: { id, vod: { userId: user.id } },
    include: { vod: true },
  })

  if (!highlight) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
  }

  const body = await request.json()
  const { action } = body

  if (action === 'generate-clip') {
    if (!highlight.vod.localPath) {
      return NextResponse.json({ error: 'VOD not downloaded' }, { status: 400 })
    }

    const clip = await prisma.clip.create({
      data: {
        vodId: highlight.vodId,
        userId: user.id,
        highlightId: highlight.id,
        title: highlight.label || `Clip from ${formatTime(highlight.startTime)}-${formatTime(highlight.endTime)}`,
        startTime: highlight.startTime,
        endTime: highlight.endTime,
        duration: highlight.endTime - highlight.startTime,
        status: 'GENERATING',
      },
    })

    await enqueueJob(user.id, 'CLIP_GENERATION', { highlightId: highlight.id, clipTitle: highlight.label })

    return NextResponse.json({ clip, message: 'Clip generation started' })
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

  const highlight = await prisma.highlight.findFirst({
    where: { id, vod: { userId: user.id } },
  })

  if (!highlight) {
    return NextResponse.json({ error: 'Highlight not found' }, { status: 404 })
  }

  await prisma.highlight.delete({ where: { id } })

  return NextResponse.json({ message: 'Highlight deleted' })
}