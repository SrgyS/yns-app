'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    if (pathname === href) {
      return true
    }

    const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href
    return (
      normalizedHref.length > 0 &&
      (pathname === normalizedHref ||
        pathname.startsWith(`${normalizedHref}/`))
    )
  }

  return (
    <nav className="flex flex-row items-center gap-6 text-sm font-medium">
      <Link
        className={cn(
          'transition-colors hover:text-foreground/80 text-foreground/60',
          isActive('/') && 'text-foreground font-semibold'
        )}
        href="/"
      >
        Главная
      </Link>
      <Link
        className={cn(
          'transition-colors hover:text-foreground/80',
          hasActiveCourse
            ? 'text-foreground/60'
            : hasAnyCourses
              ? 'text-amber-500 font-semibold'
              : 'text-foreground/40',
          isActive(planUrl) && 'text-foreground font-semibold'
        )}
        href={planUrl}
      >
        Мой план
      </Link>
      <Link
        className={cn(
          'transition-colors hover:text-foreground/80 text-foreground/60',
          isActive('/practices') && 'text-foreground font-semibold'
        )}
        href="/practices"
      >
        Отдельные
      </Link>
      <Link
        className={cn(
          'transition-colors hover:text-foreground/80 text-foreground/60',
          isActive('/recipes') && 'text-foreground font-semibold'
        )}
        href="/recipes"
      >
        Рецепты
      </Link>
      <Link
        className={cn(
          'transition-colors hover:text-foreground/80 text-foreground/60',
          isActive('/knowledge') && 'text-foreground font-semibold'
        )}
        href="/knowledge"
      >
        Знания
      </Link>
    </nav>
  )
}
