'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const MIN_INTERVAL_MS = 10_000

export function ActivityTracker() {
  const pathname = usePathname()
  const lastSentAtRef = useRef(0)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname) {
      return
    }

    const now = Date.now()
    const isSamePath = lastPathRef.current === pathname
    const isRecent = now - lastSentAtRef.current < MIN_INTERVAL_MS

    if (isSamePath && isRecent) {
      return
    }

    lastPathRef.current = pathname
    lastSentAtRef.current = now
    const win =
      typeof globalThis !== 'undefined' && 'window' in globalThis
        ? (globalThis.window as Window & {
            __PAID_ROUTE_ACTIVITY__?: boolean
          })
        : undefined

    const isPaid =
      Boolean(win?.__PAID_ROUTE_ACTIVITY__) ||
      win?.document?.documentElement.dataset.paidRoute === 'true'

    const controller = new AbortController()

    fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: pathname, paid: isPaid }),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => {})

    return () => controller.abort()
  }, [pathname])

  return null
}
