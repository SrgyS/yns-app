import { server } from '@/app/server'
import { GetCourseService } from '@/entities/course/module'
import { CourseSlug } from '@/kernel/domain/course'
import { MdxCode } from '@/shared/lib/mdx'
import { notFound } from 'next/navigation'
import { COURSE_LAYOUTS } from '../_content/layout-config'
import { BlockRenderer } from '../_ui/block-renderer'
import { EquipmentBlockComponent } from '../_ui/blocks/equipment-block'
import { TariffsBlockComponent } from '../_ui/blocks/tariffs-block'

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

      <TariffsBlockComponent
        id="tariffs-fallback"
        type="tariffs"
        isVisible
        title="Тарифы"
        course={course}
      />
    </section>
  )
}
