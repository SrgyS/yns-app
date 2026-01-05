'use client'

import { Course } from '@/entities/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Card, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { getCoursePublicPath } from '@/kernel/lib/router'
import { getMinPaidTariffPrice } from '@/kernel/domain/course'

export function CourseItem({ course }: Readonly<{ course: Course }>) {
  const minPrice = getMinPaidTariffPrice(course.tariffs)
  if (minPrice === null) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <MdxCode code={course.description} />
        {course.shortDescription && <MdxCode code={course.shortDescription} />}
      </CardHeader>
      <CardFooter>
        <Button size="lg" asChild>
          <Link href={getCoursePublicPath(course.slug)}>
            от {new Intl.NumberFormat('ru-RU').format(minPrice)}₽
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
