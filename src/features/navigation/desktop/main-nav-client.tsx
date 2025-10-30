'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/features/navigation/nav-items'
import { cn } from '@/shared/ui/utils'
import { useCallback, useEffect, useState } from 'react'

type MainNavClientProps = {
  planUrl: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
}

let lastPendingHref: string | null = null

export function MainNavClient({
  planUrl,
  // hasActiveCourse,
  // hasAnyCourses,
}: MainNavClientProps) {
  const pathname = usePathname() ?? ''
  const desktopItems = NAV_ITEMS.filter(item =>
    item.targets.includes('desktop')
  )
  // const planStateClass = hasActiveCourse
  //   ? 'text-foreground/60'
  //   : hasAnyCourses
  //     ? 'text-amber-500 font-semibold'
  //     : 'text-foreground/40'

  const [pendingHref, setPendingHref] = useState<string | null>(
    () => lastPendingHref
  )

  const isActive = useCallback(
    (href: string) => {
      const currentPath = pathname === '' ? '/' : pathname

      if (href === '/') {
        return currentPath === '/'
      }

      if (currentPath === href) {
        return true
      }

      const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href
      if (!normalizedHref) {
        return false
      }

      return (
        currentPath === normalizedHref ||
        currentPath.startsWith(`${normalizedHref}/`)
      )
    },
    [pathname]
  )

  useEffect(() => {
    if (pendingHref && isActive(pendingHref)) {
      lastPendingHref = null
      setPendingHref(null)
    }
  }, [pathname, pendingHref, isActive])

  return (
    <nav className="flex flex-row items-center gap-6 text-sm font-medium">
      {desktopItems.map(item => {
        const href = item.key === 'plan' ? planUrl : item.href
        const isCurrentRoute = isActive(href)
        const isPending = pendingHref === href
        const active = pendingHref ? isPending : isCurrentRoute
        const isDisabled = !pendingHref && isCurrentRoute

        return (
          <Link
            key={item.key}
            className={cn(
              'transition-colors hover:text-foreground/80 text-foreground/60',
              // item.key === 'plan' && planStateClass,
              active && 'text-foreground font-semibold'
            )}
            href={href}
            onClick={event => {
              if (isDisabled) {
                event.preventDefault()
                return
              }

              if (!isPending) {
                lastPendingHref = href
                setPendingHref(href)
              }
            }}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
