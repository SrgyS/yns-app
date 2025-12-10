import { server } from '@/app/server'
import { GetUserKnowledgeService } from '@/features/knowledge/module'
import { KnowledgeView } from '@/features/knowledge/_ui/knowledge-view'

export default async function KnowledgePage() {
  const knowledgeService = server.get(GetUserKnowledgeService)
  const initial = await knowledgeService.exec()

  const knowledgeByCourse = await Promise.all(
    initial.courses.map(async course => {
      const data =
        course.id === initial.courseId
          ? initial
          : await knowledgeService.exec(course.id)
      return { courseId: course.id, categories: data.categories }
    })
  )

  return (
    <KnowledgeView
      initialCourseId={initial.courseId}
      courses={initial.courses}
      knowledgeByCourse={knowledgeByCourse}
    />
  )
}
