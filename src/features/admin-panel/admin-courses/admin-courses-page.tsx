'use client'

import Link from 'next/link'
import { Course } from '@/entities/course'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

type AdminCoursesPageProps = {
  courses: Course[]
}

export function AdminCoursesPage({ courses }: AdminCoursesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Курсы</h1>
        <p className="text-muted-foreground">
          Все доступные курсы платформы. Выберите курс, чтобы открыть
          управление.
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Курсов пока нет.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => {
            // const summary =
            //   stripHtml(course.shortDescription) ||
            //   truncate(stripHtml(course.description))

            // const imageSrc = course.thumbnail || '/logo-yns.png'

            return (
              <Card key={course.id} className="flex flex-col overflow-hidden">
                {/* <div className="relative h-40 w-full bg-muted">
                  <Image
                    src={imageSrc}
                    alt={course.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div> */}
                <CardHeader className="space-y-2">
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        course.product.access === 'paid' ? 'default' : 'outline'
                      }
                    >
                      {course.product.access === 'paid'
                        ? 'Платный'
                        : 'Бесплатный'}
                    </Badge>
                    <Badge variant="secondary">
                      {course.contentType === 'SUBSCRIPTION'
                        ? 'Подписка'
                        : 'Фиксированный'}
                    </Badge>
                    <Badge variant="outline">{course.durationWeeks} нед.</Badge>
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/admin/courses/${course.slug}`}>Открыть</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
