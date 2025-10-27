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

export type NavigationTarget = 'desktop' | 'mobile'

export type NavigationItem = {
  key: NavigationItemKey
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  targets: NavigationTarget[]
}

export const NAV_ITEMS: NavigationItem[] = [
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
    href: '/course-access',
    icon: CalendarCheck,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'practices',
    label: 'Отдельные',
    href: '/practices',
    icon: Dumbbell,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'recipes',
    label: 'Рецепты',
    href: '/recipes',
    icon: UtensilsCrossed,
    targets: ['desktop', 'mobile'],
  },
  {
    key: 'knowledge',
    label: 'Знания',
    href: '/knowledge',
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
