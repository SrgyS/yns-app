import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserCourseEnrollment } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class ActivateEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository
  ) {}

  async exec(enrollmentId: string): Promise<UserCourseEnrollment> {
    try {
      // Сначала деактивируем все записи пользователя
      const enrollment = await this.userCourseEnrollmentRepository.getEnrollmentById(enrollmentId)
      
      if (!enrollment) {
        logger.error({
          msg: 'Enrollment not found',
          enrollmentId,
        })
        throw new Error('Enrollment not found')
      }
      
      // Деактивируем все записи пользователя
      await this.userCourseEnrollmentRepository.deactivateUserEnrollments(enrollment.userId)
      
      // Активируем выбранную запись
      const activatedEnrollment = await this.userCourseEnrollmentRepository.activateEnrollment(enrollmentId)
      
      logger.info({
        msg: 'Successfully activated enrollment',
        enrollmentId,
        userId: activatedEnrollment.userId,
        courseId: activatedEnrollment.courseId,
      })
      
      return activatedEnrollment
    } catch (error) {
      logger.error({
        msg: 'Error activating enrollment',
        enrollmentId,
        error,
      })
      throw new Error('Failed to activate enrollment')
    }
  }
}