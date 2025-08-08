'use client'

import { Course } from '@/entity/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import { Card, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import Link from 'next/link'

export function CourseItem({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <MdxCode code={course.description} />
        {course.shortDescription && <MdxCode code={course.shortDescription} />}
      </CardHeader>
      <CardFooter>
        <Button>
          <Link href={`/select-workout-days/${course.id}`}>Купить</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
