'use client'

import { Course } from '@/entities/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Card, CardContent, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { getCoursePublicPath } from '@/kernel/lib/router'
import { getMinPaidTariffPrice } from '@/kernel/domain/course'
import { AppImage } from '@/shared/ui/app-image'

export function CourseItem({ course }: Readonly<{ course: Course }>) {
  const minPrice = getMinPaidTariffPrice(course.tariffs)
  if (minPrice === null) {
    return null
  }

  return (
    <Card className="overflow-hidden py-2 rounded-3xl">
      <CardContent className="px-2 h-full">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center h-full">
          <div className="space-y-4 pl-2 pb-2">
            <div className="space-y-3">
              <CardTitle className="pt-2 text-xl font-bold text-primary">
                {course.title}
              </CardTitle>
              {/* <MdxCode code={course.description} /> */}
              {course.shortDescription && (
                <MdxCode className="text-sm" code={course.shortDescription} />
              )}
            </div>
            <Button size="lg" asChild className="rounded-2xl">
              <Link href={getCoursePublicPath(course.slug)}>
                от {new Intl.NumberFormat('ru-RU').format(minPrice)}₽
              </Link>
            </Button>
          </div>
          <div className="relative min-h-[220px] md:min-h-full rounded-2xl overflow-hidden">
            {course.thumbnail ? (
              <AppImage
                src={course.thumbnail}
                alt={course.title}
                fill
                className="object-cover object-bottom"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(14,116,144,0.12),rgba(15,23,42,0.08))]" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
