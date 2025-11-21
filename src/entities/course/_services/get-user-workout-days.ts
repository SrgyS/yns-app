import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetUserWorkoutDaysService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(userId: string, courseId: string): Promise<DayOfWeek[]> {
    try {
      const enrollment =
        await this.userCourseEnrollmentRepository.getEnrollment(
          userId,
          courseId
        )

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      // Берем тренировочные дни из первого enrollment (они должны быть одинаковыми для всех курсов)
      const workoutDays = enrollment.selectedWorkoutDays

      logger.info({
        msg: 'Successfully retrieved user workout days',
        userId,
        workoutDays,
      })

      return workoutDays
    } catch (error) {
      logger.error({
        msg: 'Error getting user workout days',
        userId,
        error,
      })
      throw new Error('Failed to get user workout days')
    }
  }
}
