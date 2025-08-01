import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetActiveEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async execute(userId: string): Promise<UserCourseEnrollment | null> {
    try {
      const enrollments = await this.userCourseEnrollmentRepository.getUserEnrollments(userId)

      if (enrollments.length === 0) {
        return null
      }

      // Приоритет: подписка > фиксированные курсы
      // Подписка определяется по slug курса или другим критериям
      // Пока используем простую логику: берем самый новый enrollment
      // TODO: Добавить логику определения подписки по slug или другим критериям
      const sortedEnrollments = enrollments.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )

      const activeEnrollment = sortedEnrollments[0]

      logger.info({
        msg: 'Successfully determined active enrollment',
        userId,
        activeEnrollmentId: activeEnrollment.id,
        courseId: activeEnrollment.courseId,
        totalEnrollments: enrollments.length,
      })

      return activeEnrollment
    } catch (error) {
      logger.error({
        msg: 'Error getting active enrollment',
        userId,
        error,
      })
      throw new Error('Failed to get active enrollment')
    }
  }
} 