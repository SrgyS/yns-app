'use client'
import { Course } from '@/entity/course/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Card, CardHeader, CardTitle } from '@/shared/ui/card'

export function CourseItem({ course }: { course: Course }) {
  console.log('description', course.description)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <MdxCode code={course.description} />
        {course.shortDescription && <MdxCode code={course.shortDescription} />}
      </CardHeader>
    </Card>
  )
}
