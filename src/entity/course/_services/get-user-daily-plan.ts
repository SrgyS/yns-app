import { injectable } from 'inversify'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { UserDailyPlan, GetUserDailyPlanParams } from '../../course'
import { logger } from '@/shared/lib/logger'

@injectable()
export class GetUserDailyPlanService {
  constructor(
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(params: GetUserDailyPlanParams): Promise<UserDailyPlan | null> {
    try {
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