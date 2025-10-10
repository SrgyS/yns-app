'use client'

import { Course } from '@/entities/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Card, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { CourseAction } from './course-action'

export function CourseItem({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <MdxCode code={course.description} />
        {course.shortDescription && <MdxCode code={course.shortDescription} />}
      </CardHeader>
      <CardFooter>
        <CourseAction courseId={course.id} courseSlug={course.slug} />
        {/* <Button>
          <Link href={`/select-workout-days/${course.id}`}>Купить</Link>
        </Button> */}
      </CardFooter>
    </Card>
  )
}
