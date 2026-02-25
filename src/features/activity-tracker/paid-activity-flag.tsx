'use client'

import { useLayoutEffect } from 'react'

function setPaidFlag(isPaid: boolean) {
  if (typeof window === 'undefined') return
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

  win.__PAID_ROUTE_ACTIVITY__ = isPaid
  if (isPaid) {
    root.dataset.paidRoute = 'true'
  } else {
    delete root.dataset.paidRoute
  }
}

export function PaidActivityFlag() {
  useLayoutEffect(() => {
    setPaidFlag(true)
    return () => setPaidFlag(false)
  }, [])

  return null
}
