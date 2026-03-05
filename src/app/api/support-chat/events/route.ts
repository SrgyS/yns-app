import { server } from '@/app/server'
import { NextAuthConfig } from '@/kernel/lib/next-auth/module'
import { dbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'
import { publicConfig } from '@/shared/config/public'
import { isTrustedRequestOrigin } from '@/shared/lib/security/trusted-origin'
import { getServerSession } from 'next-auth'

import {
  subscribeToSupportChatEvents,
  type SupportChatEvent,
} from '@/features/support-chat/_integrations/support-chat-events'
import {
  assertSseRateLimit,
  decrementSseConnectionCounters,
  hasExceededSseConnectionLimits,
  incrementSseConnectionCounters,
  toSseChunk,
} from '@/features/support-chat/_integrations/support-chat-sse-security'

const SSE_HEARTBEAT_INTERVAL_MS = 20_000
const SSE_MAX_DURATION_MS = 10 * 60_000
const SSE_IDLE_TIMEOUT_MS = 60_000

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

const isTrustedEventsRequestOrigin = (request: Request) => {
  return isTrustedRequestOrigin({
    requestUrl: request.url,
    originHeader: request.headers.get('origin'),
    refererHeader: request.headers.get('referer'),
    hostHeader: request.headers.get('host'),
    forwardedHostHeader: request.headers.get('x-forwarded-host'),
    forwardedProtoHeader: request.headers.get('x-forwarded-proto'),
    publicAppUrl: publicConfig.PUBLIC_URL,
  })
}

export async function GET(request: Request) {
  const session = await getServerSession(server.get(NextAuthConfig).options)

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!isTrustedEventsRequestOrigin(request)) {
    return new Response('Forbidden', { status: 403 })
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
  if (!assertSseRateLimit(rateLimitKey)) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    })
  }

  const { userConnections, ipConnections } = incrementSseConnectionCounters(
    userId,
    clientIp
  )

  if (hasExceededSseConnectionLimits(userConnections, ipConnections)) {
    decrementSseConnectionCounters(userId, clientIp)
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
        decrementSseConnectionCounters(userId, clientIp)

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
