import { server } from '@/app/server'
import { NextAuthConfig } from '@/kernel/lib/next-auth/module'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { getServerSession } from 'next-auth'

import {
  subscribeToSupportChatEvents,
  type SupportChatEvent,
} from '@/features/support-chat/_integrations/support-chat-events'

const encoder = new TextEncoder()

const SSE_HEARTBEAT_INTERVAL_MS = 20_000
const SSE_MAX_DURATION_MS = 10 * 60_000
const SSE_IDLE_TIMEOUT_MS = 60_000
const SSE_RATE_LIMIT_WINDOW_MS = 60_000
const SSE_RATE_LIMIT_MAX_REQUESTS = 20
const SSE_RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000
const SSE_MAX_CONNECTIONS_PER_USER = 3
const SSE_MAX_CONNECTIONS_PER_IP = 20

const ALLOWED_SSE_EVENTS = new Set<string>([
  'connected',
  'heartbeat',
  'dialog.created',
  'message.created',
  'read.updated',
])

const requestHitsByKey = new Map<string, number[]>()
const activeConnectionsByUser = new Map<string, number>()
const activeConnectionsByIp = new Map<string, number>()
let lastRateLimitCleanupAt = 0

const sanitizeSseEventName = (event: string) => {
  if (ALLOWED_SSE_EVENTS.has(event)) {
    return event
  }

  return 'message.created'
}

const stringifySseData = (data: unknown): string | null => {
  try {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString()
      }

      return value
    })
  } catch {
    return null
  }
}

const toSseChunk = (event: string, data: unknown): Uint8Array | null => {
  const payload = stringifySseData(data)
  if (payload === null) {
    return null
  }

  const safeEventName = sanitizeSseEventName(event)
  return encoder.encode(`event: ${safeEventName}\ndata: ${payload}\n\n`)
}

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0]?.trim()
    if (ip) {
      return ip
    }
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

const incrementMapCounter = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 0) + 1
  map.set(key, next)
  return next
}

const decrementMapCounter = (map: Map<string, number>, key: string) => {
  const current = map.get(key)
  if (!current || current <= 1) {
    map.delete(key)
    return
  }

  map.set(key, current - 1)
}

const assertRateLimit = (key: string): boolean => {
  const now = Date.now()
  if (now - lastRateLimitCleanupAt >= SSE_RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    requestHitsByKey.forEach((timestamps, mapKey) => {
      const active = timestamps.filter(ts => now - ts < SSE_RATE_LIMIT_WINDOW_MS)
      if (active.length > 0) {
        requestHitsByKey.set(mapKey, active)
        return
      }

      requestHitsByKey.delete(mapKey)
    })
    lastRateLimitCleanupAt = now
  }

  const recent = (requestHitsByKey.get(key) ?? []).filter(
    ts => now - ts < SSE_RATE_LIMIT_WINDOW_MS
  )

  if (recent.length >= SSE_RATE_LIMIT_MAX_REQUESTS) {
    requestHitsByKey.set(key, recent)
    return false
  }

  recent.push(now)
  requestHitsByKey.set(key, recent)
  return true
}

const canAccessSupportChatEvents = async (
  role: string,
  userId: string
): Promise<boolean> => {
  if (role === 'ADMIN') {
    return true
  }

  if (role !== 'STAFF') {
    return false
  }

  const permission = await dbClient.staffPermission.findUnique({
    where: {
      userId,
    },
    select: {
      canManageSupportChats: true,
    },
  })

  return Boolean(permission?.canManageSupportChats)
}

const shouldSendEvent = (
  role: string,
  userId: string,
  event: SupportChatEvent
): boolean => {
  if (role === 'USER') {
    return event.userId === userId
  }

  return true
}

export async function GET(request: Request) {
  const session = await getServerSession(server.get(NextAuthConfig).options)

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const role = session.user.role
  const userId = session.user.id
  const clientIp = getClientIp(request)

  if (role !== 'USER') {
    const isAllowed = await canAccessSupportChatEvents(role, userId)
    if (!isAllowed) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  const rateLimitKey = `${userId}:${clientIp}`
  if (!assertRateLimit(rateLimitKey)) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    })
  }

  const userConnections = incrementMapCounter(activeConnectionsByUser, userId)
  const ipConnections = incrementMapCounter(activeConnectionsByIp, clientIp)

  if (userConnections > SSE_MAX_CONNECTIONS_PER_USER) {
    decrementMapCounter(activeConnectionsByUser, userId)
    decrementMapCounter(activeConnectionsByIp, clientIp)
    return new Response('Too Many Connections', { status: 429 })
  }

  if (ipConnections > SSE_MAX_CONNECTIONS_PER_IP) {
    decrementMapCounter(activeConnectionsByUser, userId)
    decrementMapCounter(activeConnectionsByIp, clientIp)
    return new Response('Too Many Connections', { status: 429 })
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let isClosed = false
      let unsubscribe = () => {}
      let heartbeat: ReturnType<typeof setInterval> | null = null
      let idleTimeout: ReturnType<typeof setTimeout> | undefined
      let maxDurationTimeout: ReturnType<typeof setTimeout> | null = null

      const closeStream = () => {
        if (isClosed) {
          return
        }

        isClosed = true
        request.signal.removeEventListener('abort', closeStream)

        if (heartbeat !== null) {
          clearInterval(heartbeat)
        }

        if (idleTimeout) {
          clearTimeout(idleTimeout)
        }

        if (maxDurationTimeout !== null) {
          clearTimeout(maxDurationTimeout)
        }

        unsubscribe()
        decrementMapCounter(activeConnectionsByUser, userId)
        decrementMapCounter(activeConnectionsByIp, clientIp)

        try {
          controller.close()
        } catch {
          // stream can be already closed by runtime
        }
      }

      const scheduleIdleTimeout = () => {
        if (idleTimeout) {
          clearTimeout(idleTimeout)
        }

        idleTimeout = setTimeout(() => {
          closeStream()
        }, SSE_IDLE_TIMEOUT_MS)
      }

      const safeEnqueue = (event: string, data: unknown) => {
        if (isClosed) {
          return false
        }

        const chunk = toSseChunk(event, data)
        if (!chunk) {
          logger.warn({
            msg: 'Support chat SSE serialization failed',
            event,
          })
          closeStream()
          return false
        }

        try {
          controller.enqueue(chunk)
          scheduleIdleTimeout()
          return true
        } catch {
          logger.warn({
            msg: 'Support chat SSE enqueue failed',
            event,
          })
          closeStream()
          return false
        }
      }

      if (
        !safeEnqueue('connected', {
          ok: true,
          timestamp: new Date().toISOString(),
        })
      ) {
        return
      }

      unsubscribe = subscribeToSupportChatEvents(event => {
        if (!shouldSendEvent(role, userId, event)) {
          return
        }

        safeEnqueue(event.type, event)
      })

      heartbeat = setInterval(() => {
        safeEnqueue('heartbeat', {
            timestamp: new Date().toISOString(),
          })
      }, SSE_HEARTBEAT_INTERVAL_MS)

      maxDurationTimeout = setTimeout(() => {
        closeStream()
      }, SSE_MAX_DURATION_MS)

      scheduleIdleTimeout()
      request.signal.addEventListener('abort', closeStream)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
