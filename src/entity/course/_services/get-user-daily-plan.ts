import { injectable } from 'inversify'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { UserDailyPlan, GetUserDailyPlanParams } from '../../course'
import { logger } from '@/shared/lib/logger'
import { GetCourseService } from './get-course'
import { CheckCourseAccessService } from '@/entity/user-access/module'

@injectable()
export class GetUserDailyPlanService {
  constructor(
    private userDailyPlanRepository: UserDailyPlanRepository,
    private getCourseService: GetCourseService,
    private checkCourseAccess: CheckCourseAccessService
  ) {}

  async exec(params: GetUserDailyPlanParams): Promise<UserDailyPlan | null> {
    try {
      // Получаем курс и проверяем доступ пользователя
      const course = await this.getCourseService.exec({ id: params.courseId })
      if (!course) {
        logger.warn({ msg: 'Курс не найден при получении дневного плана', params })
        return null
      }
      if (!course.product) {
        logger.error({ msg: 'У курса отсутствует product', courseId: course.id })
        return null
      }

      const hasAccess = await this.checkCourseAccess.exec({
        userId: params.userId,
        course: {
          id: course.id,
          product: course.product,
          contentType: course.contentType,
        },
      })

      if (!hasAccess) {
        logger.info({ msg: 'Нет доступа к курсу при получении дневного плана', params })
        return null
      }

      const userDailyPlan = await this.userDailyPlanRepository.getUserDailyPlan(params)

      if (userDailyPlan) {
        logger.info({
          msg: 'Successfully retrieved user daily plan',
          userId: params.userId,
          dayNumberInCourse: params.dayNumberInCourse,
          planId: userDailyPlan.id,
        })
      }

      return userDailyPlan
    } catch (error) {
      logger.error({
        msg: 'Error getting user daily plan',
        params,
        error,
      })
      throw new Error('Failed to get user daily plan')
    }
  }
}