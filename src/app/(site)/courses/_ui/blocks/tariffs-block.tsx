'use client'

import React from 'react'

import { TariffsBlock } from '@/kernel/domain/course-page'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { getCourseOrderPath, getCoursePublicPath } from '@/kernel/lib/router'
import { Course } from '@/entities/course'
import { Badge } from '@/shared/ui/badge'
import { Check } from 'lucide-react'

interface TariffsBlockComponentProps extends TariffsBlock {
  course: Course
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

const DEFAULT_TARIFF_PRESENTATION_OPTIONS: NonNullable<
  TariffsBlock['tariffPresentation']
>['options'] = [
  {
    feedback: false,
    badge: 'Без обратной связи',
    includes: [
      'Полный доступ к материалам курса',
      'Пошаговый план занятий',
      'Доступ в личный кабинет на весь срок тарифа',
    ],
  },
  {
    feedback: true,
    badge: 'С обратной связью',
    includes: [
      'Полный доступ к материалам курса',
      'Пошаговый план занятий',
      'Проверка и комментарии от куратора',
    ],
  },
]

const getDurationMonths = (durationDays: number | undefined) => {
  if (!durationDays || durationDays <= 0) {
    return null
  }

  if (durationDays % 30 === 0) {
    return durationDays / 30
  }

  return null
}

const getMonthsLabel = (months: number) => {
  const mod10 = months % 10
  const mod100 = months % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${months} месяц`
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${months} месяца`
  }

  return `${months} месяцев`
}

const getDurationLabel = (durationDays: number | undefined) => {
  const durationMonths = getDurationMonths(durationDays)
  if (durationMonths) {
    return getMonthsLabel(durationMonths)
  }

  if (durationDays && durationDays > 0) {
    return `Доступ на ${durationDays} дней`
  }

  return 'Без ограничения по сроку'
}

const getFeedbackOrder = (feedback: boolean) => {
  if (feedback) {
    return 1
  }

  return 0
}

const sortTariffs = (
  a: Course['tariffs'][number],
  b: Course['tariffs'][number]
) => {
  const feedbackOrderA = getFeedbackOrder(a.feedback)
  const feedbackOrderB = getFeedbackOrder(b.feedback)

  if (feedbackOrderA !== feedbackOrderB) {
    return feedbackOrderA - feedbackOrderB
  }

  const durationA = a.durationDays ?? Number.MAX_SAFE_INTEGER
  const durationB = b.durationDays ?? Number.MAX_SAFE_INTEGER
  return durationA - durationB
}

const resolveTariffPresentation = ({
  tariffPresentation,
  feedback,
}: {
  tariffPresentation: TariffsBlock['tariffPresentation']
  feedback: boolean
}) => {
  const options =
    tariffPresentation?.options ?? DEFAULT_TARIFF_PRESENTATION_OPTIONS

  const feedbackOption = options.find(option => option.feedback === feedback)

  if (feedbackOption) {
    return feedbackOption
  }

  return DEFAULT_TARIFF_PRESENTATION_OPTIONS.find(
    option => option.feedback === feedback
  )
}

const interpolateTariffTemplate = ({
  text,
  durationLabel,
}: {
  text: string
  durationLabel: string
}) => {
  return text.replaceAll('{duration}', durationLabel)
}

const renderTariffCard = ({
  course,
  tariff,
  urlReturn,
  tariffPresentation,
}: {
  course: Course
  tariff: Course['tariffs'][number]
  urlReturn: string
  tariffPresentation: TariffsBlock['tariffPresentation']
}) => {
  const price = CURRENCY_FORMATTER.format(tariff.price ?? 0)
  const durationLabel = getDurationLabel(tariff.durationDays)
  const presentation = resolveTariffPresentation({
    tariffPresentation,
    feedback: tariff.feedback,
  })
  const feedbackLabel = tariff.feedback
    ? 'С обратной связью'
    : 'Без обратной связи'
  const cardTitle = presentation?.cardTitle || feedbackLabel
  const cardBadge = presentation?.badge || feedbackLabel
  const includes = (presentation?.includes ?? []).map(item =>
    interpolateTariffTemplate({
      text: item,
      durationLabel,
    })
  )

  return (
    <Card key={tariff.id} className="flex h-full flex-col rounded-3xl">
      <CardHeader className="space-y-2 p-4 md:space-y-3 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={tariff.feedback ? 'default' : 'secondary'}>
            {cardBadge}
          </Badge>
          <Badge variant="outline">{durationLabel}</Badge>
        </div>
        <CardTitle className="text-lg">{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 text-sm text-foreground/80 md:space-y-4 md:p-6 md:pt-0">
        <div className="space-y-1.5 md:space-y-2">
          {includes.map((item, index) => (
            <div
              key={`${tariff.id}-${index}`}
              className="flex items-start gap-2"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="text-base font-semibold text-foreground">{price}</div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button size="lg" className="w-full" asChild>
          <Link
            href={getCourseOrderPath(course.slug, urlReturn, '', tariff.id)}
          >
            Купить за {price}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export function TariffsBlockComponent({
  title,
  course,
  tariffPresentation,
}: TariffsBlockComponentProps) {
  const resolvedTitle = title || 'Тарифы'

  const urlReturn = getCoursePublicPath(course.slug)
  const paidTariffs = course.tariffs
    .filter(tariff => (tariff.price ?? 0) > 0)
    .sort(sortTariffs)

  if (paidTariffs.length === 0) {
    return null
  }

  const withoutFeedbackTariffs = paidTariffs.filter(tariff => !tariff.feedback)
  const withFeedbackTariffs = paidTariffs.filter(tariff => tariff.feedback)
  const groupTitles = tariffPresentation?.groupTitles
  const shouldGroupByFeedback = Boolean(groupTitles)
  const withoutFeedbackTitle =
    groupTitles?.withoutFeedback || 'Без обратной связи'
  const withFeedbackTitle = groupTitles?.withFeedback || 'С обратной связью'

  return (
    <section className="space-y-3 md:space-y-4" id="tariffs">
      <h2 className="mb-0 text-2xl font-semibold tracking-tight">
        {resolvedTitle}
      </h2>
      <div className="text-lg font-semibold tracking-tight text-primary md:text-2xl">
        {course.title}
      </div>
      {shouldGroupByFeedback ? (
        <div className="space-y-4 md:space-y-6">
          {withoutFeedbackTariffs.length > 0 && (
            <section className="space-y-2.5 md:space-y-3">
              <h3 className="text-lg font-medium">{withoutFeedbackTitle}</h3>
              <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {withoutFeedbackTariffs.map(tariff =>
                  renderTariffCard({
                    course,
                    tariff,
                    urlReturn,
                    tariffPresentation,
                  })
                )}
              </div>
            </section>
          )}
          {withFeedbackTariffs.length > 0 && (
            <section className="space-y-2.5 md:space-y-3">
              <h3 className="text-lg font-medium">{withFeedbackTitle}</h3>
              <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                {withFeedbackTariffs.map(tariff =>
                  renderTariffCard({
                    course,
                    tariff,
                    urlReturn,
                    tariffPresentation,
                  })
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {paidTariffs.map(tariff =>
            renderTariffCard({ course, tariff, urlReturn, tariffPresentation })
          )}
        </div>
      )}
    </section>
  )
}
