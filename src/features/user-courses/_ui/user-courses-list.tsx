'use client'

import { useState } from 'react'
import { Course } from '@/entity/course'


import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { UserId } from '@/kernel/domain/user'
import { UserCourseItem } from './user-course-item'


interface UserCoursesListProps {
  id: UserId
  courses: Course[]
}

export function UserCoursesList({ id, courses }: UserCoursesListProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)
  
  const { getUserEnrollments } = useCourseEnrollment()
  const enrollmentsQuery = getUserEnrollments(id || '')

  // Получаем все enrollments для селектора
  const enrollments = enrollmentsQuery?.data || []

//   if (isLoading) {
//     return <Spinner aria-label="Загрузка курсов" />
//   }

  if (!enrollments || enrollments.length === 0) {
    return <div className="text-center py-4">У вас пока нет купленных курсов</div>
  }

  // Находим курсы, на которые пользователь записан
  const userCourses = enrollments.map(enrollment => {
    const course = courses.find(c => c.id === enrollment.courseId)
    return { enrollment, course }
  }).filter(item => item.course) // Фильтруем, если курс не найден

  // Устанавливаем активный курс на основе свойства active в enrollment
  if (!activeTab && userCourses.length > 0) {
    // Ищем курс с active: true
    const activeCourse = userCourses.find(({ enrollment }) => enrollment.active)
    
    // Если есть активный курс, устанавливаем его, иначе берем первый
    setActiveTab(activeCourse ? activeCourse.enrollment.id : userCourses[0].enrollment.id)
  }

  return (
    <div className="space-y-4">
      
      {userCourses.length > 0 ? (
        <Tabs 
          value={activeTab || undefined} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-flow-col auto-cols-fr">
            {userCourses.map(({ enrollment, course }) => (
              <TabsTrigger key={enrollment.id} value={enrollment.id}>
                {course?.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {userCourses.map(({ enrollment, course }) => (
            <TabsContent key={enrollment.id} value={enrollment.id}>
              {course && (
                <UserCourseItem 
                  course={course} 
                  enrollment={enrollment}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-4">У вас пока нет купленных курсов</div>
      )}
    </div>
  )
}