const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 120
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000

// TODO(redis): Replace process-local map with Redis (or other shared store) for:
// - consistent limits across multiple app instances;
// - bounded memory via key TTL and centralized eviction;
// - atomic counters.
const requestHitsByKey = new Map<string, number[]>()
let lastCleanupAt = 0

const cleanupRateLimitStore = (now: number) => {
  if (now - lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    return
  }

  requestHitsByKey.forEach((timestamps, key) => {
    const active = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS)
    if (active.length > 0) {
      requestHitsByKey.set(key, active)
      return
    }

    requestHitsByKey.delete(key)
  })

  lastCleanupAt = now
}

export const assertSupportChatAttachmentRateLimit = (
  key: string,
  now = Date.now()
): boolean => {
  cleanupRateLimitStore(now)

  const recent = (requestHitsByKey.get(key) ?? []).filter(
    ts => now - ts < RATE_LIMIT_WINDOW_MS
  )

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestHitsByKey.set(key, recent)
    return false
  }

  recent.push(now)
  requestHitsByKey.set(key, recent)
  return true
}

export const supportChatAttachmentRateLimitRetryAfterSeconds = Math.ceil(
  RATE_LIMIT_WINDOW_MS / 1000
)

export const __resetSupportChatAttachmentRateLimitForTests = () => {
  requestHitsByKey.clear()
  lastCleanupAt = 0
}
