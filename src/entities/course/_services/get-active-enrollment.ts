import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetActiveEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(userId: string): Promise<UserCourseEnrollment | null> {
    try {
      // Сначала пытаемся получить активную запись напрямую
      const activeEnrollment = await this.userCourseEnrollmentRepository.getActiveEnrollment(userId)
      
      // Если активная запись найдена, возвращаем её
      if (activeEnrollment) {
        logger.info({
          msg: 'Successfully found active enrollment',
          userId,
          activeEnrollmentId: activeEnrollment.id,
          courseId: activeEnrollment.courseId,
        })
        
        return activeEnrollment
      }
      
      logger.info({
        msg: 'No active enrollment found for user',
        userId,
      })
      
      return null
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