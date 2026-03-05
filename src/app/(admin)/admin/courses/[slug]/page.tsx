import Link from 'next/link'

import { CreateCourseForm } from '@/features/admin-panel/courses/_ui/create-course-form'
import { Button } from '@/shared/ui/button'

type PageProps = {
  params?: Promise<{ slug: string }>
}

export default async function AdminCoursePage({ params }: PageProps) {
  const resolvedParams = params ? await params : { slug: '' }
  const slug = resolvedParams.slug

  return (
    <div className="space-y-6">
      <div className="flex md:justify-between flex-col md:flex-row items-start md:items-center gap-3">
        <h1 className="text-fluid-lg font-semibold tracking-tight">
          Редактирование курса
        </h1>
        <div className="flex gap-2">
          {/* <Button asChild variant="secondary">
              <Link href={`/admin/courses/${slug}`}>Инфо</Link>
            </Button> */}
          <Button asChild>
            <Link href={`/admin/courses/${slug}/daily-plan`}>
              Настройка тренировок
            </Link>
          </Button>
        </div>
      </div>

      <CreateCourseForm editSlug={slug} />
    </div>
  )
}
