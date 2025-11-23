import { server } from '@/app/server'
import { NextAuthConfig } from '@/kernel/lib/next-auth/module'
import { dbClient } from '@/shared/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const activitySchema = z
  .object({
    path: z.string().trim().min(1).max(512).optional(),
    menu: z.string().trim().min(1).max(128).optional(),
    paid: z.boolean().optional(),
  })
  .refine(
    data => typeof data.path === 'string' || typeof data.menu === 'string',
    {
      message: 'Either path or menu is required',
      path: ['path'],
    }
  )

export async function POST(req: NextRequest) {
  const session = await getServerSession(server.get(NextAuthConfig).options)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = activitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const now = new Date()
  const path = parsed.data.path ?? ''
  const isPaidPath = parsed.data.paid === true
  const dayStart = new Date(now)
  dayStart.setUTCHours(0, 0, 0, 0)

  const tx = [
    dbClient.user.update({
      where: { id: session.user.id },
      data: { lastActivityAt: now },
    }),
    dbClient.userActivity.create({
      data: {
        userId: session.user.id,
        path: parsed.data.path ?? null,
        menu: parsed.data.menu ?? null,
        createdAt: now,
      },
    }),
  ]

  if (isPaidPath) {
    tx.push(
      dbClient.userPaidActivity.upsert({
        where: {
          userId_date: {
            userId: session.user.id,
            date: dayStart,
          },
        },
        update: {
          path: path || null,
          menu: parsed.data.menu ?? null,
        },
        create: {
          userId: session.user.id,
          date: dayStart,
          path: path || null,
          menu: parsed.data.menu ?? null,
          createdAt: now,
        },
      })
    )
  }

  await dbClient.$transaction(tx)

  return NextResponse.json({ ok: true })
}
