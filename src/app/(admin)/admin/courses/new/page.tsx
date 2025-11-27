import { CreateCourseForm } from '@/features/admin-panel/courses/_ui/create-course-form'

export default function CreateCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Новый курс</h1>
        <p className="text-muted-foreground">
          Заполните информацию для создания нового курса.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  )
}
