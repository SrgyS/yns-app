'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LogIn } from 'lucide-react'
import { PLATFORM_NAV_ITEMS } from '@/features/navigation/nav-items'
import { startNavigationFeedback } from '@/shared/lib/navigation/navigation-feedback'
import { SmartLink } from '@/shared/ui/smart-link'
import { cn } from '@/shared/ui/utils'
import { SignInButton } from '@/features/auth/_ui/sign-in-button'

type MobileBottomNavClientProps = {
  planUrl?: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
  profileHref: string
  isAuthenticated: boolean
}

const MOBILE_NAV_ITEMS = PLATFORM_NAV_ITEMS.filter(item =>
  item.targets.includes('mobile')
)

function isPathActive(pathname: string, href: string): boolean {
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
    currentPath === normalizedHref || currentPath.startsWith(`${normalizedHref}/`)
  )
}

function resolveItemHref(
  key: string,
  defaultHref: string,
  planUrl: string | undefined,
  profileHref: string
): string {
  if (key === 'plan' && planUrl) {
    return planUrl
  }

  if (key === 'profile') {
    return profileHref
  }

  return defaultHref
}

let lastPendingHref: string | null = null

export function MobileBottomNavClient({
  planUrl,
  hasActiveCourse,
  hasAnyCourses,
  profileHref,
  isAuthenticated,
}: Readonly<MobileBottomNavClientProps>) {
  const pathname = usePathname() ?? '/'

  const [pendingHref, setPendingHref] = useState<string | null>(
    () => lastPendingHref
  )
  const [pressedItemKey, setPressedItemKey] = useState<string | null>(null)

  const pressTimeoutRef = useRef<number | null>(null)

  const triggerPressEffect = useCallback((itemKey: string) => {
    setPressedItemKey(itemKey)

    if (pressTimeoutRef.current) {
      window.clearTimeout(pressTimeoutRef.current)
    }

    pressTimeoutRef.current = window.setTimeout(() => {
      setPressedItemKey(current => (current === itemKey ? null : current))
      pressTimeoutRef.current = null
    }, 220)
  }, [])

  useEffect(() => {
    if (pendingHref && isPathActive(pathname, pendingHref)) {
      lastPendingHref = null
      setPendingHref(null)
    }
  }, [pathname, pendingHref])

  useEffect(() => {
    return () => {
      if (pressTimeoutRef.current) {
        window.clearTimeout(pressTimeoutRef.current)
      }
    }
  }, [])

  let planStateClass = ''
  if (!hasActiveCourse) {
    if (hasAnyCourses) {
      planStateClass = 'font-semibold text-amber-500'
    } else {
      planStateClass = 'text-muted-foreground/50'
    }
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <ul
        className="flex items-start justify-around px-2 pt-2 text-xs max-[370px]:px-1.5 max-[370px]:pt-1.5 max-[370px]:text-[10px]"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {MOBILE_NAV_ITEMS.map(item => {
          const href = resolveItemHref(item.key, item.href, planUrl, profileHref)

          const isCurrentRoute = isPathActive(pathname, href)
          const isPending = pendingHref === href
          const isPressed = pressedItemKey === item.key
          const active = pendingHref ? isPending : isCurrentRoute
          const isDisabled = !pendingHref && isCurrentRoute
          const Icon = item.icon

          if (item.key === 'profile' && !isAuthenticated) {
            return (
              <li key={item.key} className="flex flex-1 justify-center">
                <SignInButton
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full max-w-[140px] flex-col items-center justify-start gap-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground max-[370px]:gap-0.5 max-[370px]:px-1.5 max-[370px]:py-0.5 max-[370px]:text-[10px]"
                >
                  <LogIn className="size-6 max-[370px]:size-5" />
                  <span>Войти</span>
                </SignInButton>
              </li>
            )
          }

          return (
            <li key={item.key} className="flex flex-1 justify-center">
              <SmartLink
                disableNavigationFeedback
                href={href}
                className={cn(
                  'group flex w-full max-w-35 flex-col items-center justify-start gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-200 ease-out max-[370px]:gap-0.5 max-[370px]:px-1.5 max-[370px]:py-0.5',
                  'hover:text-foreground',
                  item.key === 'plan' && planStateClass,
                  active && 'text-primary'
                )}
                onPointerDown={() => {
                  if (isDisabled) {
                    return
                  }

                  triggerPressEffect(item.key)
                }}
                onKeyDown={event => {
                  if (isDisabled) {
                    return
                  }

                  if (event.key === 'Enter' || event.key === ' ') {
                    triggerPressEffect(item.key)
                  }
                }}
                onClick={event => {
                  if (isDisabled) {
                    event.preventDefault()
                    return
                  }

                  if (!isPending) {
                    lastPendingHref = href
                    setPendingHref(href)
                    startNavigationFeedback()
                  }
                }}
              >
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-start gap-1 transition-transform duration-200 ease-out transform-gpu will-change-transform max-[370px]:gap-0.5',
                    isPressed && 'scale-105'
                  )}
                >
                  <Icon
                    className={cn(
                      'relative z-10 size-6 transition-colors duration-200 ease-out max-[370px]:size-5',
                      active && 'text-primary'
                    )}
                    aria-hidden="true"
                  />

                  <span className="relative z-10 text-center">
                    {item.label}
                  </span>
                </div>
              </SmartLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
