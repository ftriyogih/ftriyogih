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
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const jobs = await prisma.job.findMany({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      vod: {
        select: { id: true, title: true, twitchVodId: true },
      },
    },
  })

  const total = await prisma.job.count({
    where: {
      userId: user.id,
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
    },
  })

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}