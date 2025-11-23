'use client'

import { useLayoutEffect } from 'react'

export function PaidActivityFlag() {
  useLayoutEffect(() => {
    const win =
      typeof globalThis !== 'undefined' && 'window' in globalThis
        ? (globalThis.window as Window & {
            __PAID_ROUTE_ACTIVITY__?: boolean
          })
        : undefined

    const root = win?.document?.documentElement
    if (!win || !root) {
      return
    }

    win.__PAID_ROUTE_ACTIVITY__ = true
    root.dataset.paidRoute = 'true'

    return () => {
      win.__PAID_ROUTE_ACTIVITY__ = false
      delete root.dataset.paidRoute
    }
  }, [])

  return null
}
