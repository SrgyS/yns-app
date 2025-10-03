'use client'

import { Course } from '@/entities/course'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { UserId } from '@/kernel/domain/user'
import { UserCourseItem } from './user-course-item'


interface UserCoursesListProps {
  id: UserId
  courses: Course[]
}

export function UserCoursesList({ id, courses }: UserCoursesListProps) {
  const { getUserEnrollments } = useCourseEnrollment()
  const enrollmentsQuery = getUserEnrollments(id || '')

  // Получаем все enrollments для селектора
  const enrollments = enrollmentsQuery?.data || []

  if (!enrollments || enrollments.length === 0) {
    return <div className="text-center py-4">У вас пока нет купленных курсов</div>
  }

  // Находим курсы, на которые пользователь записан
  const userCourses = enrollments.map(enrollment => {
    const course = courses.find(c => c.id === enrollment.courseId)
    return { enrollment, course }
  }).filter(item => item.course) as Array<{ enrollment: any; course: Course }>

  return (
    <div className="space-y-4">
      {userCourses.map(({ enrollment, course }) => (
        <UserCourseItem 
          course={course} 
          enrollment={enrollment}
          key={enrollment.id}
        />
      ))}
    </div>
  )
}