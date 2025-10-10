'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/features/navigation/nav-items'
import { cn } from '@/shared/ui/utils'
import { SignInButton } from '@/features/auth/_ui/sign-in-button'
import { LogIn } from 'lucide-react'

type MobileBottomNavClientProps = {
  planUrl: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
  profileHref: string
  isAuthenticated: boolean
}

export function MobileBottomNavClient({
  planUrl,
  hasActiveCourse,
  hasAnyCourses,
  profileHref,
  isAuthenticated,
}: MobileBottomNavClientProps) {
  const pathname = usePathname() ?? '/'
  const mobileItems = NAV_ITEMS.filter((item) =>
    item.targets.includes('mobile')
  )

  const isActive = (href: string) => {
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
  }

  const planStateClass = hasActiveCourse
    ? ''
    : hasAnyCourses
      ? 'text-amber-500 font-semibold'
      : 'text-muted-foreground/50'

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <ul
        className="flex items-center justify-around px-2 pt-2 text-xs max-[370px]:px-1.5 max-[370px]:pt-1.5 max-[370px]:text-[10px]"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {mobileItems.map((item) => {
          const href =
            item.key === 'plan'
              ? planUrl
              : item.key === 'profile'
                ? profileHref
                : item.href

          const active = isActive(href)
          const Icon = item.icon

          if (item.key === 'profile' && !isAuthenticated) {
            return (
              <li key={item.key} className="flex flex-1 justify-center">
                <SignInButton
                  variant="ghost"
                  size="sm"
                  className="h-auto w-full max-w-[140px] flex-col items-center gap-1 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground max-[370px]:gap-0.5 max-[370px]:px-1.5 max-[370px]:py-0.5 max-[370px]:text-[10px]"
                >
                  <LogIn className="h-5 w-5 max-[370px]:h-4 max-[370px]:w-4" />
                  <span>Войти</span>
                </SignInButton>
              </li>
            )
          }

          return (
            <li key={item.key} className="flex flex-1 justify-center">
              <Link
                href={href}
                className={cn(
                  'group flex flex-col items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground max-[370px]:gap-0.5 max-[370px]:px-1.5 max-[370px]:py-0.5',
                  item.key === 'plan' && planStateClass,
                  active && 'text-foreground font-semibold'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors max-[370px]:h-4 max-[370px]:w-4',
                    active && 'text-foreground'
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
