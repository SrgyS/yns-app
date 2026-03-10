import type { ComponentType, SVGProps } from 'react'
import {
  BookOpen,
  CalendarCheck,
  Dumbbell,
  Home,
  User,
  UtensilsCrossed,
} from 'lucide-react'
import {
  PUBLIC_STATIC_NAV_ITEMS,
  type PublicNavigationStaticItem,
  type PublicNavigationStaticItemKey,
} from './public-navigation-config'

export type NavigationItemKey =
  | 'home'
  | 'plan'
  | 'practices'
  | 'recipes'
  | 'knowledge'
  | 'profile'
  | 'courses'
  | 'equipment'
  | 'results'
  | 'articles'
  | 'cabinet'

export type NavigationTarget = 'desktop' | 'mobile'

export type NavigationItem = {
  key: NavigationItemKey
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  targets: NavigationTarget[]
}

type PublicMenuNavigationItemKey = Extract<
  PublicNavigationStaticItemKey,
  NavigationItemKey
>

export const PLATFORM_NAV_ITEMS: NavigationItem[] = [
  {
    key: 'home',
    label: 'Главная',
    href: '/',
    icon: Home,
    targets: ['desktop'], // Removed 'mobile' - accessible via profile page button
  },
  {
    key: 'plan',
    label: 'Мой план',
    href: '/platform/plan',
    icon: CalendarCheck,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'practices',
    label: 'Отдельные',
    href: '/platform/practices',
    icon: Dumbbell,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'recipes',
    label: 'Рецепты',
    href: '/platform/recipes',
    icon: UtensilsCrossed,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'knowledge',
    label: 'Знания',
    href: '/platform/knowledge',
    icon: BookOpen,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'profile',
    label: 'Профиль',
    href: '/auth/sign-in',
    icon: User,
    targets: ['mobile'],
  },
]

const PUBLIC_NAV_ICONS: Record<
  PublicNavigationStaticItemKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  home: Home,
  about: User,
  results: CalendarCheck,
  equipment: Dumbbell,
  'personal-support': User,
}

function isPublicMenuItem(
  item: PublicNavigationStaticItem
): item is PublicNavigationStaticItem & { key: PublicMenuNavigationItemKey } {
  return item.key === 'home' || item.key === 'results' || item.key === 'equipment'
}

export const PUBLIC_NAV_ITEMS: NavigationItem[] = PUBLIC_STATIC_NAV_ITEMS
  .filter(isPublicMenuItem)
  .filter(
    item => item.targets.includes('desktop') || item.targets.includes('mobile')
  )
  .map(item => ({
    key: item.key,
    label: item.label,
    href: item.href,
    icon: PUBLIC_NAV_ICONS[item.key],
    targets: item.targets.filter(
      (target): target is NavigationTarget =>
        target === 'desktop' || target === 'mobile'
    ),
  }))
