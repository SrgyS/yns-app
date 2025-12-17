import { MainNavClient } from './main-nav-client'
import { getNavigationContext } from '@/features/navigation/nav-context'

export async function MainNav({
  variant,
}: Readonly<{
  variant: 'public' | 'private'
}>) {
  if (variant === 'public') {
    return <MainNavClient variant="public" planUrl={undefined} />
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
