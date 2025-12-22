import type { ComponentType, SVGProps } from 'react'
import {
  BookOpen,
  CalendarCheck,
  Dumbbell,
  Home,
  User,
  UtensilsCrossed,
} from 'lucide-react'

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

export const PLATFORM_NAV_ITEMS: NavigationItem[] = [
  {
    key: 'home',
    label: 'Главная',
    href: '/',
    icon: Home,
    targets: ['desktop', 'mobile'],
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

export const PUBLIC_NAV_ITEMS: NavigationItem[] = [
  {
    key: 'home',
    label: 'Главная',
    href: '/',
    icon: Home,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'results',
    label: 'Результаты участниц',
    href: '/results',
    icon: CalendarCheck,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'articles',
    label: 'Статьи',
    href: '/articles',
    icon: BookOpen,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'equipment',
    label: 'Оборудование',
    href: '/equipment',
    icon: Dumbbell,
    targets: ['desktop', 'mobile'],
  },
]
