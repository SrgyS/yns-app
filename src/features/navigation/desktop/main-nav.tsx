import { MainNavClient } from './main-nav-client'
import { getNavigationContext } from '@/features/navigation/nav-context'

export async function MainNav() {
  const navigationContext = await getNavigationContext()

  return (
    <MainNavClient
      hasActiveCourse={navigationContext.hasActiveCourse}
      hasAnyCourses={navigationContext.hasAnyCourses}
      planUrl={navigationContext.planUrl}
    />
  )
}
