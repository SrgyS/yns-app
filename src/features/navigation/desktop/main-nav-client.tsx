'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { PLATFORM_NAV_ITEMS } from '@/features/navigation/nav-items'
import type { PublicCoursesMenu } from '@/features/navigation/_services/get-public-navigation'
import type { PublicNavigationLink } from '@/features/navigation/public-navigation-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/ui/utils'
import { useCallback, useEffect, useState } from 'react'

type MainNavClientProps = {
  variant: 'public' | 'private'
  planUrl?: string
  hasActiveCourse?: boolean
  hasAnyCourses?: boolean
  desktopItems?: PublicNavigationLink[]
  desktopCoursesMenu?: PublicCoursesMenu
}

type DesktopNavItem = {
  key: string
  label: string
  href: string
}

type ActiveHrefMatcher = (href: string) => boolean

type DesktopNavLinkProps = {
  item: DesktopNavItem
  pendingHref: string | null
  isActive: ActiveHrefMatcher
  onNavigate: (href: string) => void
}

type CoursesDropdownProps = {
  menu: PublicCoursesMenu
  isActive: ActiveHrefMatcher
}

function resolveDesktopItems(
  variant: MainNavClientProps['variant'],
  desktopItems: PublicNavigationLink[],
  planUrl?: string
): DesktopNavItem[] {
  if (variant === 'public') {
    return desktopItems
  }

  return PLATFORM_NAV_ITEMS.filter(item => item.targets.includes('desktop')).map(
    item => ({
      key: item.key,
      label: item.label,
      href: item.key === 'plan' && planUrl ? planUrl : item.href,
    })
  )
}

function isPathActive(pathname: string, href: string) {
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

function DesktopNavLink({
  item,
  pendingHref,
  isActive,
  onNavigate,
}: Readonly<DesktopNavLinkProps>) {
  const isCurrentRoute = isActive(item.href)
  const isPending = pendingHref === item.href
  const active = pendingHref ? isPending : isCurrentRoute
  const isDisabled = !pendingHref && isCurrentRoute

  return (
    <Link
      className={cn(
        'text-foreground/60 transition-colors hover:text-foreground/80',
        active && 'text-foreground font-semibold'
      )}
      href={item.href}
      onClick={event => {
        if (isDisabled) {
          event.preventDefault()
          return
        }

        onNavigate(item.href)
      }}
    >
      {item.label}
    </Link>
  )
}

function CoursesDropdown({ menu, isActive }: Readonly<CoursesDropdownProps>) {
  const isDropdownActive = menu.links.some(link => isActive(link.href))

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1 text-foreground/60 transition-colors outline-hidden hover:text-foreground/80',
          isDropdownActive && 'text-foreground font-semibold'
        )}
      >
        <span>{menu.label}</span>
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56 rounded-xl p-2">
        {menu.links.map(link => {
          const active = isActive(link.href)

          return (
            <DropdownMenuItem
              key={link.key}
              asChild
              className={cn(
                'cursor-pointer rounded-lg px-3 py-2',
                active && 'bg-accent text-accent-foreground'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MainNavClient({
  variant,
  planUrl,
  desktopItems = [],
  desktopCoursesMenu,
  // hasActiveCourse,
  // hasAnyCourses,
}: Readonly<MainNavClientProps>) {
  const pathname = usePathname() ?? ''
  const resolvedDesktopItems = resolveDesktopItems(variant, desktopItems, planUrl)

  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const isActive = useCallback(
    (href: string) => isPathActive(pathname, href),
    [pathname]
  )

  const handleNavigate = useCallback((href: string) => {
    if (pendingHref === href) {
      return
    }

    setPendingHref(href)
  }, [pendingHref])

  useEffect(() => {
    if (pendingHref && isActive(pendingHref)) {
      setPendingHref(null)
    }
  }, [pathname, pendingHref, isActive])

  return (
    <nav className="flex flex-row items-center gap-6 text-sm font-medium">
      {resolvedDesktopItems.map(item => (
        <DesktopNavLink
          key={item.key}
          item={item}
          pendingHref={pendingHref}
          isActive={isActive}
          onNavigate={handleNavigate}
        />
      ))}
      {variant === 'public' && desktopCoursesMenu ? (
        <CoursesDropdown menu={desktopCoursesMenu} isActive={isActive} />
      ) : null}
    </nav>
  )
}
