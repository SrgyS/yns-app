'use client'

import { CheckOrder } from '@/features/course-order/check-order'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'

export default function Page() {
  return (
    <>
      <CheckOrder />
      <FullPageSpinner isLoading></FullPageSpinner>
    </>
  )
}
