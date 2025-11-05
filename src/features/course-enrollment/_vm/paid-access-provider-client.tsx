'use client'

import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { courseEnrollmentApi } from '../_api'
import { PaidAccessProvider } from './paid-access-context'
import type { PaidAccessState } from './paid-access-types'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'

type PaidAccessProviderClientProps = {
  initialState: PaidAccessState
  children: React.ReactNode
}

export function PaidAccessProviderClient({
  initialState,
  children,
}: PaidAccessProviderClientProps) {
  const { data, isLoading, isFetching, isError, error } =
    courseEnrollmentApi.course.getAccessibleEnrollments.useQuery(
      undefined,
      {
        ...CACHE_SETTINGS.FREQUENT_UPDATE,
        initialData: initialState,
      }
    )

  useEffect(() => {
    if (isError) {
      const message =
        error instanceof Error ? error.message : 'Не удалось проверить доступ'
      toast.error(message)
    }
  }, [isError, error])

  const value = useMemo<PaidAccessState>(() => {
    return data ?? initialState
  }, [data, initialState])

  const showSpinner = (isLoading && !data) || isFetching

  return (
    <>
      <FullPageSpinner isLoading={showSpinner} />
      <PaidAccessProvider value={value}>{children}</PaidAccessProvider>
    </>
  )
}
