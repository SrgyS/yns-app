import { Course, UserCourseEnrollment } from '@/entities/course'
import { CoursesRepository } from '@/entities/course/_repositories/course'
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserId } from '@/kernel/domain/user'
import { injectable } from 'inversify'

export type UserCourseWithEnrollment = {
  course: Course
  enrollment: UserCourseEnrollment
}

@injectable()
export class GetUserCoursesListService {
  constructor(
    private readonly userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly checkCourseAccessService: CheckCourseAccessService
  ) {}

  async exec(userId: UserId): Promise<UserCourseWithEnrollment[]> {
    const enrollments =
      await this.userCourseEnrollmentRepository.getUserEnrollments(userId)

    if (!enrollments.length) {
      return []
    }

    const userCourses = await Promise.all(
      enrollments.map(async enrollment => {
        const course = await this.coursesRepository.courseById(
          enrollment.courseId
        )

        if (!course) {
          return null
        }

        const hasAccess = await this.checkCourseAccessService.exec({
          userId,
          course: {
            id: course.id,
            contentType: course.contentType,
            product: course.product,
          },
        })

        if (!hasAccess) {
          return null
        }

        return {
          course,
          enrollment,
        }
      })
    )

    return userCourses.filter((item): item is UserCourseWithEnrollment => !!item)
  }
}
