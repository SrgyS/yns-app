import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { DayOfWeek } from '@prisma/client'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetUserWorkoutDaysService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async execute(userId: string): Promise<DayOfWeek[]> {
    try {
      const enrollments = await this.userCourseEnrollmentRepository.getUserEnrollments(userId)

      if (enrollments.length === 0) {
        return []
      }

      // Берем тренировочные дни из первого enrollment (они должны быть одинаковыми для всех курсов)
      const workoutDays = enrollments[0].selectedWorkoutDays

      logger.info({
        msg: 'Successfully retrieved user workout days',
        userId,
        workoutDays,
        enrollmentsCount: enrollments.length,
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