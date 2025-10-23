import { injectable } from 'inversify'
import { UserDailyPlanRepository } from '@/entities/course/_repositories/user-daily-plan'
import { GetCourseService } from '@/entities/course/_services/get-course'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserDailyPlan, GetUserDailyPlanParams } from '@/entities/course'
import { logger } from '@/shared/lib/logger'

const LOG_PREFIX = '[GetUserDailyPlanService]'

async function logTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    return await action()
  } finally {
    const duration = Date.now() - start
    logger.info({
      msg: `${LOG_PREFIX} ${label}`,
      durationMs: duration,
    })
  }
}

@injectable()
export class GetUserDailyPlanService {
  constructor(
    private readonly userDailyPlanRepository: UserDailyPlanRepository,
    private readonly getCourseService: GetCourseService,
    private readonly checkCourseAccess: CheckCourseAccessService
  ) {}

  async exec(params: GetUserDailyPlanParams): Promise<UserDailyPlan | null> {
    try {
      const course = await logTiming('getCourseService.exec', () =>
        this.getCourseService.exec({ id: params.courseId })
      )
      if (!course) {
        logger.warn({
          msg: 'Course not found while fetching daily plan',
          params,
        })
        return null
      }

      if (!course.product) {
        logger.error({
          msg: 'Course product missing while fetching daily plan',
          courseId: course.id,
        })
        return null
      }

      const hasAccess = await logTiming('checkCourseAccess.exec', () =>
        this.checkCourseAccess.exec({
          userId: params.userId,
          course: {
            id: course.id,
            product: course.product,
            contentType: course.contentType,
          },
        })
      )

      if (!hasAccess) {
        logger.info({
          msg: 'Access denied while fetching daily plan',
          params,
        })
        return null
      }

      const userDailyPlan = await logTiming(
        'userDailyPlanRepository.getUserDailyPlan',
        () => this.userDailyPlanRepository.getUserDailyPlan(params)
      )

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
        msg: 'Error fetching user daily plan (feature)',
        params,
        error,
      })
      throw new Error('Failed to get user daily plan')
    }
  }
}
