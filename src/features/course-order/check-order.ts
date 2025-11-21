'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { courseOrderApi } from './_api'
import { toast } from 'sonner'
import { getCoursePath } from '@/kernel/lib/router'

export function CheckOrder() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const checkQuery = courseOrderApi.courseOrder.check.useQuery(
    {
      orderId: searchParams.get('_payform_order_id') ?? '',
    },
    {
      refetchInterval: query => {
        if (query.state.status === 'error') {
          return false
        }
        return 500
      },
      retry: 0,
    }
  )

  useEffect(() => {
    if (checkQuery.isError) {
      toast.error('Что-то пошло не так', {
        description: 'Ошибка формирования ссылки на покупку',
      })
      router.replace('/')
    }
  }, [checkQuery.isError, router])

  useEffect(() => {
    if (checkQuery.data?.state.type === 'success') {
      router.replace(getCoursePath(checkQuery.data.courseSlug ?? ''))
    }
  }, [router, checkQuery.data?.courseSlug, checkQuery.data?.state.type])

  return null
}
