'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ThemeProvider } from '@/features/theme/theme-provider'
import { AppSessionProvider } from '@/kernel/lib/next-auth/client'
import { ComposeChildren } from '@/shared/lib/react'
import { ActivityTracker } from '@/features/activity-tracker/activity-tracker'
import { sharedApi } from '@/kernel/lib/trpc/client'
import { httpBatchLink } from '@trpc/client'
import { publicConfig } from '@/shared/config/public'
import { Toaster } from '@/shared/ui/sonner'
import { doneNavigationFeedback } from '@/shared/lib/navigation/navigation-feedback'
import { TopProgressBar } from '@/shared/ui/top-progress-bar'

function NavigationFeedbackCompletion() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const previousRouteRef = useRef<string | null>(null)
  const routeKey = useMemo(() => {
    const query = searchParams.toString()
    if (query) {
      return `${pathname}?${query}`
    }

    return pathname
  }, [pathname, searchParams])

  useEffect(() => {
    if (previousRouteRef.current === null) {
      previousRouteRef.current = routeKey
      return
    }

    if (previousRouteRef.current === routeKey) {
      return
    }

    previousRouteRef.current = routeKey
    doneNavigationFeedback()
  }, [routeKey])

  return null
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    sharedApi.createClient({
      links: [
        httpBatchLink({
          url: `${publicConfig.PUBLIC_URL}/api/trpc`,
        }),
      ],
    })
  )

  return (
    <ComposeChildren>
      <sharedApi.Provider client={trpcClient} queryClient={queryClient}>
        <></>
      </sharedApi.Provider>

      <QueryClientProvider client={queryClient} />
      <ThemeProvider />
      <AppSessionProvider />
      <>
        <TopProgressBar />
        <Suspense fallback={null}>
          <NavigationFeedbackCompletion />
        </Suspense>
        <Toaster />
        <ActivityTracker />
        {children}
      </>
    </ComposeChildren>
  )
}
