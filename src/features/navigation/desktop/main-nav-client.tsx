'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/features/navigation/nav-items'
import { cn } from '@/shared/ui/utils'

type MainNavClientProps = {
  planUrl: string
  hasActiveCourse: boolean
  hasAnyCourses: boolean
}

export function MainNavClient({
  planUrl,
  hasActiveCourse,
  hasAnyCourses,
}: MainNavClientProps) {
  const pathname = usePathname() ?? ''
  const desktopItems = NAV_ITEMS.filter((item) =>
    item.targets.includes('desktop')
  )
  const planStateClass = hasActiveCourse
    ? 'text-foreground/60'
    : hasAnyCourses
      ? 'text-amber-500 font-semibold'
      : 'text-foreground/40'

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

  return (
    <nav className="flex flex-row items-center gap-6 text-sm font-medium">
      {desktopItems.map((item) => {
        const href = item.key === 'plan' ? planUrl : item.href
        const active = isActive(href)

        return (
          <Link
            key={item.key}
            className={cn(
              'transition-colors hover:text-foreground/80 text-foreground/60',
              item.key === 'plan' && planStateClass,
              active && 'text-foreground font-semibold'
            )}
            href={href}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
