import { getNavigationContext } from '@/features/navigation/nav-context'
import { MobileBottomNavClient } from './mobile-bottom-nav-client'

export async function MobileBottomNav({
  variant,
}: {
  variant: 'auth' | 'private' | 'public'
}) {
  if (variant === 'auth') {
    return null
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
