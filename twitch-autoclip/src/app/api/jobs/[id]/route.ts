import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cancelJob } from '@/lib/job-queue'
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

  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
    include: {
      vod: {
        select: { id: true, title: true, twitchVodId: true },
      },
    },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
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

  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status === 'RUNNING' || job.status === 'PENDING') {
    await cancelJob(id)
    return NextResponse.json({ message: 'Job cancelled' })
  }

  return NextResponse.json({ error: 'Cannot cancel completed or failed job' }, { status: 400 })
}