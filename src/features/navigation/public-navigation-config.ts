export type PublicNavigationTarget = 'desktop' | 'mobile' | 'footer'

export type PublicNavigationSection = 'main' | 'footer-secondary'

export type PublicNavigationStaticItemKey =
  | 'home'
  | 'about'
  | 'results'
  | 'equipment'
  | 'personal-support'

export type PublicNavigationStaticItem = {
  key: PublicNavigationStaticItemKey
  label: string
  href: string
  targets: PublicNavigationTarget[]
  section: PublicNavigationSection
  order: number
}

export type PublicNavigationLink = {
  key: string
  label: string
  href: string
}

export const PUBLIC_STATIC_NAV_ITEMS: PublicNavigationStaticItem[] = [
  {
    key: 'home',
    label: 'Главная',
    href: '/',
    targets: ['desktop', 'mobile'],
    section: 'main',
    order: 10,
  },
  {
    key: 'about',
    label: 'Обо мне',
    href: '/about',
    targets: ['footer'],
    section: 'footer-secondary',
    order: 15,
  },
  {
    key: 'results',
    label: 'Результаты участниц',
    href: '/results',
    targets: ['desktop', 'mobile', 'footer'],
    section: 'footer-secondary',
    order: 20,
  },
  {
    key: 'equipment',
    label: 'Оборудование',
    href: '/equipment',
    targets: ['desktop', 'mobile', 'footer'],
    section: 'footer-secondary',
    order: 30,
  },
  {
    key: 'personal-support',
    label: 'Персональная работа',
    href: '/#individual',
    targets: ['footer'],
    section: 'main',
    order: 40,
  },
]

export const PUBLIC_COURSES_MENU: PublicNavigationLink = {
  key: 'courses',
  label: 'Курсы',
  href: '/courses',
}

export const PUBLIC_FOOTER_SECTION_TITLES = {
  courses: 'Курсы и предложения',
  secondary: 'Другие страницы',
} as const
