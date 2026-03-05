const SSE_RATE_LIMIT_WINDOW_MS = 60_000
const SSE_RATE_LIMIT_MAX_REQUESTS = 20
const SSE_RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000
const SSE_MAX_CONNECTIONS_PER_USER = 3
const SSE_MAX_CONNECTIONS_PER_IP = 20

// TODO(security:S1): replace in-memory SSE counters/rate-limit state with Redis
// before horizontal scaling. Current Maps protect only within a single process.
// Required migration scope:
// 1) global atomic increments for rate/connection limits,
// 2) TTL-based cleanup for stale connection keys,
// 3) safe decrement on disconnect/abort/error paths.
const requestHitsByKey = new Map<string, number[]>()
const activeConnectionsByUser = new Map<string, number>()
const activeConnectionsByIp = new Map<string, number>()
let lastRateLimitCleanupAt = 0

export const ALLOWED_SSE_EVENTS = new Set<string>([
  'connected',
  'heartbeat',
  'dialog.created',
  'message.created',
  'message.updated',
  'read.updated',
])

const encoder = new TextEncoder()

export const sanitizeSseEventName = (event: string) => {
  if (ALLOWED_SSE_EVENTS.has(event)) {
    return event
  }

  return 'message.created'
}

export const stringifySseData = (data: unknown): string | null => {
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

export const toSseChunk = (event: string, data: unknown): Uint8Array | null => {
  const payload = stringifySseData(data)
  if (payload === null) {
    return null
  }

  const safeEventName = sanitizeSseEventName(event)
  return encoder.encode(`event: ${safeEventName}\ndata: ${payload}\n\n`)
}

export const assertSseRateLimit = (key: string): boolean => {
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

const incrementMapCounter = (map: Map<string, number>, key: string) => {
  const next = (map.get(key) ?? 0) + 1
  map.set(key, next)
  return next
}

export const decrementSseConnectionCounters = (userId: string, clientIp: string) => {
  const decrementMapCounter = (map: Map<string, number>, key: string) => {
    const current = map.get(key)
    if (!current || current <= 1) {
      map.delete(key)
      return
    }

    map.set(key, current - 1)
  }

  decrementMapCounter(activeConnectionsByUser, userId)
  decrementMapCounter(activeConnectionsByIp, clientIp)
}

export const incrementSseConnectionCounters = (userId: string, clientIp: string) => {
  const userConnections = incrementMapCounter(activeConnectionsByUser, userId)
  const ipConnections = incrementMapCounter(activeConnectionsByIp, clientIp)

  return {
    userConnections,
    ipConnections,
  }
}

export const hasExceededSseConnectionLimits = (
  userConnections: number,
  ipConnections: number
) => {
  if (userConnections > SSE_MAX_CONNECTIONS_PER_USER) {
    return true
  }

  if (ipConnections > SSE_MAX_CONNECTIONS_PER_IP) {
    return true
  }

  return false
}

export const resetSseSecurityState = () => {
  requestHitsByKey.clear()
  activeConnectionsByUser.clear()
  activeConnectionsByIp.clear()
  lastRateLimitCleanupAt = 0
}

export const getSseConnectionCountForUser = (userId: string) => {
  return activeConnectionsByUser.get(userId) ?? 0
}

export const getSseConnectionCountForIp = (clientIp: string) => {
  return activeConnectionsByIp.get(clientIp) ?? 0
}
