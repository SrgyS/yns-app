'use client'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { courseOrderApi } from './_api'
import { createCourseOrderSchema } from './_domain/schemas'
import { toast } from 'sonner'

export function StartOrder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const createPaymentLink = courseOrderApi.courseOrder.start.useMutation()

  const lastStartedQuery = useRef<string | null>(null)

  useEffect(() => {
    if (lastStartedQuery.current === searchParamsString) {
      return
    }

    lastStartedQuery.current = searchParamsString

    const res = createCourseOrderSchema.safeParse(
      Object.fromEntries(new URLSearchParams(searchParamsString).entries())
    )

    if (res.success) {
      console.log('createPaymentLink', res.data)
      createPaymentLink.mutate(res.data, {
        onSuccess({ url }: { url: string }) {
          console.log('redirect to', url)
          router.replace(url)
        },
        onError() {
          toast.error('Что-то пошло не так', {
            description: 'Ошибка формирования ссылки на покупку',
          })
          router.replace(res.data.urlReturn)
        },
      })
      return
    }

    toast.error('Что-то пошло не так', {
      description: 'Ошибка параметров покупки курса 1',
    })
    router.back()
  }, [createPaymentLink, router, searchParamsString])

  return null
}
