'use client'

import { useSearchParams } from 'next/navigation'
import { KnowledgeCategoriesList } from './_ui/categories-list'
import { CourseKnowledgeManager } from './_ui/course-knowledge-manager'

export function AdminKnowledgePage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const openCreate = searchParams.get('new') === '1'

  if (courseId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Темы курса</h1>
          <p className="text-muted-foreground">
            Отметьте темы, которые должны отображаться у пользователей этого курса. Редактирование темы или статьи повлияет на все курсы, где она используется.
          </p>
        </div>
        <CourseKnowledgeManager courseId={courseId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">База знаний (Глобальная)</h1>
        <p className="text-muted-foreground">
          Управление всеми темами и статьями. Здесь вы создаете контент, который затем можно привязать к курсам.
        </p>
      </div>

      <KnowledgeCategoriesList autoOpenCreate={openCreate} />
    </div>
  )
}
