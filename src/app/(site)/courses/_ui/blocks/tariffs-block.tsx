'use client'

import React from 'react'

import { TariffsBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { getCourseOrderPath, getCoursePublicPath } from '@/kernel/lib/router'
import { Course } from '@/entities/course'

interface TariffsBlockComponentProps extends TariffsBlock {
  course: Course
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function TariffsBlockComponent({ title, course }: TariffsBlockComponentProps) {
  const urlReturn = getCoursePublicPath(course.slug)

  return (
    <section className="space-y-4" id="tariffs">
      <h2 className="text-2xl font-semibold tracking-tight">{title || 'Тарифы'}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {course.tariffs.map(tariff => {
          if ((tariff.price ?? 0) <= 0) {
            return null
          }

          const price = CURRENCY_FORMATTER.format(tariff.price ?? 0)
          const durationLabel = tariff.durationDays
            ? `Доступ на ${tariff.durationDays} дней`
            : 'Без ограничения по сроку'
          const feedbackLabel = tariff.feedback
            ? 'С обратной связью'
            : 'Без обратной связи'

          return (
            <Card key={tariff.id} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{feedbackLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-foreground/80">
                <div>{durationLabel}</div>
                <div className="text-base font-semibold text-foreground">
                  {price}
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button size="lg" className="w-full" asChild>
                  <Link
                    href={getCourseOrderPath(
                      course.slug,
                      urlReturn,
                      '',
                      tariff.id
                    )}
                  >
                    Купить за {price}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
