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
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const clips = await prisma.clip.findMany({
    where: {
      userId: user.id,
      ...(vodId ? { vodId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      vod: {
        select: { id: true, title: true, twitchVodId: true },
      },
      highlight: {
        select: { id: true, label: true, confidence: true },
      },
    },
  })

  const total = await prisma.clip.count({
    where: {
      userId: user.id,
      ...(vodId ? { vodId } : {}),
      ...(status ? { status: status as any } : {}),
    },
  })

  return NextResponse.json({
    clips,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}