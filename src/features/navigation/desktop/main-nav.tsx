import { MainNavClient } from './main-nav-client'
import { getPublicNavigation } from '@/features/navigation/_services/get-public-navigation'
import { getNavigationContext } from '@/features/navigation/nav-context'

export async function MainNav({
  variant,
}: Readonly<{
  variant: 'public' | 'private'
}>) {
  if (variant === 'public') {
    const publicNavigation = await getPublicNavigation()

    return (
      <MainNavClient
        variant="public"
        desktopItems={publicNavigation.desktopItems}
        desktopCoursesMenu={publicNavigation.desktopCoursesMenu}
      />
    )
  }

  const navigationContext = await getNavigationContext()

  return (
    <MainNavClient
      variant="private"
      hasActiveCourse={navigationContext.hasActiveCourse}
      hasAnyCourses={navigationContext.hasAnyCourses}
      planUrl={navigationContext.planUrl}
    />
  )
}
