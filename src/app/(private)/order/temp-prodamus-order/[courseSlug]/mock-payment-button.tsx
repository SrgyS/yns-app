'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { toast } from 'sonner'

interface MockPaymentButtonProps {
  courseId: string
  courseSlug: string
  orderId: string
}

// TODO(prod-integr): удалить после подключения реального платёжного флоу через Prodamus
export function MockPaymentButton({ courseId, courseSlug, orderId }: MockPaymentButtonProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClick = async () => {
    try {
      setIsProcessing(true)

      const response = await fetch(
        `/order/temp-prodamus-order/${courseSlug}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to complete payment mock')
      }

      const data = (await response.json()) as { nextUrl?: string }

      router.replace(data?.nextUrl ?? `/select-workout-days/${courseId}`)
    } catch (error) {
      console.error('Mock payment completion failed', error)
      toast.error('Что-то пошло не так', {
        description: 'Не удалось завершить оплату',
      })
      setIsProcessing(false)
    }
  }

  return (
    <Button className="w-full sm:w-auto" size="lg" onClick={handleClick} disabled={isProcessing}>
      {isProcessing ? 'Обработка…' : 'Оплатить'}
    </Button>
  )
}
