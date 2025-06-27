import { CourseEntityModule } from '@/features/course/server'
import { CoursesListModule } from '@/features/courses-list/server'
import { UpdateProfileModule } from '@/features/update-profile/server'
import { UserEntityModule } from '@/features/user/server'
import { Container } from 'inversify'

export function init() {
  const container = new Container()

  container.load(
    CoursesListModule,
    CourseEntityModule,
    UserEntityModule,
    UpdateProfileModule
  )

  return container
}
