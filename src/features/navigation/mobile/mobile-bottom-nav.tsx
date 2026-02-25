import { getNavigationContext } from '@/features/navigation/nav-context'
import { MobileBottomNavClient } from './mobile-bottom-nav-client'
import { PublicMobileNavClient } from './public-mobile-nav-client'
import { server } from '@/app/server'
import { GetCoursesListService } from '@/entities/course/module'

export async function MobileBottomNav({
  variant,
}: {
  variant: 'auth' | 'private' | 'public'
}) {
  if (variant === 'auth') {
    return null
  }

  if (variant === 'public') {
    const coursesService = server.get(GetCoursesListService)
    const courses = await coursesService.exec()
    const navigationContext = await getNavigationContext()

    return (
      <PublicMobileNavClient
        courses={courses}
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
