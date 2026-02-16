import { server } from '@/app/server'
import { GetCourseService } from '@/entities/course/module'
import { CourseSlug } from '@/kernel/domain/course'
import {
  getCourseOrderPath,
  getCoursePublicPath,
} from '@/kernel/lib/router'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COURSE_LAYOUTS } from '../_content/layout-config'
import { BlockRenderer } from '../_ui/block-renderer'
import { EquipmentBlockComponent } from '../_ui/blocks/equipment-block'

const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseSlug: CourseSlug }>
}) {
  const { courseSlug } = await params
  const courseService = server.get(GetCourseService)
  const course = await courseService.exec({ slug: courseSlug })

  if (!course) {
    notFound()
  }

  const layout = COURSE_LAYOUTS[courseSlug]

  if (layout) {
    return (
      <section className="pt-14 pb-7">
        <BlockRenderer blocks={layout} course={course} />
      </section>
    )
  }

  const urlReturn = getCoursePublicPath(course.slug)

  return (
    <section className="space-y-10 pb-4 pt-14">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <div className="text-foreground/80">
          <MdxCode code={course.description} />
        </div>
      </section>

      <EquipmentBlockComponent
        id="equipment-fallback"
        type="equipment"
        isVisible
        title="Оборудование для курса"
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Тарифы</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {course.tariffs.map(tariff => {
            if (tariff.price <= 0) {
              return null
            }

            const price = CURRENCY_FORMATTER.format(tariff.price)
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
    </section>
  )
}
