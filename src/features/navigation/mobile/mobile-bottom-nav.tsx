import { getNavigationContext } from '@/features/navigation/nav-context'
import { MobileBottomNavClient } from './mobile-bottom-nav-client'
import { PublicMobileNavClient } from './public-mobile-nav-client'
import { getPublicNavigation } from '@/features/navigation/_services/get-public-navigation'

export async function MobileBottomNav({
  variant,
}: {
  variant: 'auth' | 'private' | 'public'
}) {
  if (variant === 'auth') {
    return null
  }

  if (variant === 'public') {
    const publicNavigation = await getPublicNavigation()
    const navigationContext = await getNavigationContext()

    return (
      <PublicMobileNavClient
        menuItems={publicNavigation.mobileMenuItems}
        courseItems={publicNavigation.courseItems}
        profileHref={navigationContext.profileHref}
        isAuthenticated={navigationContext.isAuthenticated}
      />
    )
  }

  const navigationContext = await getNavigationContext()

  return (
    <MobileBottomNavClient
      hasActiveCourse={navigationContext.hasActiveCourse}
      hasAnyCourses={navigationContext.hasAnyCourses}
      planUrl={navigationContext.planUrl}
      profileHref={navigationContext.profileHref}
      isAuthenticated={navigationContext.isAuthenticated}
    />
  )
}
