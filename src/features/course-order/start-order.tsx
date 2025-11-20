'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { courseOrderApi } from './_api'
import { createCourseOrderSchema } from './_domain/schemas'
import { toast } from 'sonner'

export function StartOrder() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createPaymentLink = courseOrderApi.courseOrder.start.useMutation()

  useEffect(() => {
    const res = createCourseOrderSchema.safeParse(
      Object.fromEntries(searchParams.entries())
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
    } else {
      toast.error('Что-то пошло не так', {
        description: 'Ошибка параметров покупки курса 1',
      })
      router.back()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
