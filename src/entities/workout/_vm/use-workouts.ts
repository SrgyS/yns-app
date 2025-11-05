import { WorkoutSection, WorkoutSubsection } from '@prisma/client'
import { workoutCatalogApi } from '../_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

type UseWorkoutsParams = {
  section?: WorkoutSection | null
  subsection?: WorkoutSubsection | null
  search?: string | null
}

export function useWorkouts({
  section,
  subsection,
  search,
}: UseWorkoutsParams) {
  const normalizedSection = section ?? undefined
  const normalizedSubsection = subsection ?? undefined
  const normalizedSearch = search?.trim()

  return workoutCatalogApi.workoutCatalog.listBySection.useQuery(
    {
      section: normalizedSection!,
      subsection: normalizedSubsection ?? null,
      search:
        normalizedSearch && normalizedSearch.length > 0
          ? normalizedSearch
          : undefined,
    },
    {
      enabled: Boolean(normalizedSection),
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      retry: false,
    }
  )
}
