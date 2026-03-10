import { cache } from 'react'
import { server } from '@/app/server'
import { GetCoursesListService } from '@/entities/course/module'
import { logger } from '@/shared/lib/logger'
import {
  PUBLIC_COURSES_MENU,
  PUBLIC_FOOTER_SECTION_TITLES,
  PUBLIC_STATIC_NAV_ITEMS,
  type PublicNavigationLink,
} from '../public-navigation-config'

export type PublicCoursesMenu = {
  key: string
  label: string
  links: PublicNavigationLink[]
}

export type PublicFooterSection = {
  key: string
  title: string
  links: PublicNavigationLink[]
}

export type PublicNavigationModel = {
  desktopItems: PublicNavigationLink[]
  desktopCoursesMenu: PublicCoursesMenu
  mobileMenuItems: PublicNavigationLink[]
  footerSections: PublicFooterSection[]
  courseItems: PublicNavigationLink[]
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order)
}

function toNavigationLinks<T extends PublicNavigationLink>(
  items: T[]
): PublicNavigationLink[] {
  return items.map(({ key, label, href }) => ({
    key,
    label,
    href,
  }))
}

export const getPublicNavigation = cache(
  async (): Promise<PublicNavigationModel> => {
    const coursesService = server.get(GetCoursesListService)
    let courses: Awaited<ReturnType<GetCoursesListService['exec']>> = []

    try {
      courses = await coursesService.exec()
    } catch (error) {
      logger.error(
        { error },
        'Failed to build public navigation: courses list is unavailable'
      )
    }

    const courseItems = courses.map((course, index) => ({
      key: `course-${course.slug}`,
      label: course.title,
      href: `/courses/${course.slug}`,
      order: index,
    }))

    const desktopItems = sortByOrder(
      PUBLIC_STATIC_NAV_ITEMS.filter(item => item.targets.includes('desktop'))
    ).map(({ key, label, href }) => ({
      key,
      label,
      href,
    }))

    const mobileMenuItems = sortByOrder(
      PUBLIC_STATIC_NAV_ITEMS.filter(
        item => item.targets.includes('mobile') && item.href !== '/'
      )
    ).map(({ key, label, href }) => ({
      key,
      label,
      href,
    }))

    const footerSecondaryLinks = sortByOrder(
      PUBLIC_STATIC_NAV_ITEMS.filter(
        item =>
          item.targets.includes('footer') && item.section === 'footer-secondary'
      )
    ).map(({ key, label, href }) => ({
      key,
      label,
      href,
    }))

    const personalSupportLinks = sortByOrder(
      PUBLIC_STATIC_NAV_ITEMS.filter(item => item.key === 'personal-support')
    ).map(({ key, label, href }) => ({
      key,
      label,
      href,
    }))

    return {
      desktopItems,
      desktopCoursesMenu: {
        key: PUBLIC_COURSES_MENU.key,
        label: PUBLIC_COURSES_MENU.label,
        links: toNavigationLinks([...courseItems, ...personalSupportLinks]),
      },
      mobileMenuItems,
      footerSections: [
        {
          key: 'courses-and-offers',
          title: PUBLIC_FOOTER_SECTION_TITLES.courses,
          links: toNavigationLinks([...courseItems, ...personalSupportLinks]),
        },
        {
          key: 'secondary-pages',
          title: PUBLIC_FOOTER_SECTION_TITLES.secondary,
          links: footerSecondaryLinks,
        },
      ],
      courseItems: toNavigationLinks([...courseItems, ...personalSupportLinks]),
    }
  }
)
