import { server } from '@/app/server'
import { GetCourseService } from '@/entities/course/module'
import { CourseSlug } from '@/kernel/domain/course'
import { MdxCode } from '@/shared/lib/mdx'
import { notFound } from 'next/navigation'
import {
  COURSE_LAYOUTS,
  FALLBACK_COURSE_TESTIMONIALS_BLOCK,
} from '../_content/layout-config'
import { BlockRenderer } from '../_ui/block-renderer'
import { EquipmentBlockComponent } from '../_ui/blocks/equipment-block'
import { TariffsBlockComponent } from '../_ui/blocks/tariffs-block'
import { CourseCtaBlock } from '../_ui/blocks/course-cta-block'
import { TestimonialsBlockComponent } from '../_ui/blocks/testimonials-block'

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
      <section className="pb-5 md:pb-7 pt-14">
        <BlockRenderer blocks={layout} course={course} />
        <CourseCtaBlock />
      </section>
    )
  }

  return (
    <section className="space-y-6 pb-4 pt-14 md:space-y-10">
      <section className="space-y-3 md:space-y-4">
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

      <TariffsBlockComponent
        id="tariffs-fallback"
        type="tariffs"
        isVisible
        title="Тарифы"
        course={course}
      />

      <CourseCtaBlock />
    </section>
  )
}
