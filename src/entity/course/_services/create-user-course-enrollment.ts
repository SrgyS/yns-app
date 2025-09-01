import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'

@injectable()
export class CreateUserCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      // Используем транзакцию для атомарного создания enrollment и userDailyPlan
      return await dbClient.$transaction(async tx => {
        const existingEnrollments =
          await this.userCourseEnrollmentRepository.getUserEnrollments(
            params.userId,
            tx
          )

        if (existingEnrollments.length > 0) {
          // Деактивируем все предыдущие записи пользователя на курсы
          await this.userCourseEnrollmentRepository.deactivateUserEnrollments(
            params.userId,
            tx
          )
        }

        // Создаем enrollment внутри транзакции
        const enrollment = await tx.userCourseEnrollment.create({
          data: {
            userId: params.userId,
            courseId: params.courseId,
            startDate: params.startDate,
            selectedWorkoutDays: params.selectedWorkoutDays,
            hasFeedback: params.hasFeedback ?? false,
            active: true,
          },
          include: {
            course: { select: { id: true, slug: true, title: true } },
          },
        })

        // Обновляем UserAccess, связывая его с созданным enrollment
        await tx.userAccess.updateMany({
          where: {
            userId: params.userId,
            courseId: params.courseId,
            enrollmentId: null, // Только те, что еще не связаны
          },
          data: {
            enrollmentId: enrollment.id,
          },
        })

        await this.userDailyPlanRepository.generateUserDailyPlansForEnrollment(
          enrollment.id,
          tx
        )

        return {
          id: enrollment.id,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          selectedWorkoutDays: enrollment.selectedWorkoutDays,
          startDate: enrollment.startDate,
          hasFeedback: enrollment.hasFeedback,
          active: enrollment.active,
          course: {
            id: enrollment.course.id,
            slug: enrollment.course.slug,
            title: enrollment.course.title,
          },
        }
      })
    } catch (error) {
      logger.error({
        msg: 'Error creating user course enrollment',
        params,
        error,
      })
      // Проверяем, является ли ошибка ошибкой уникальности Prisma
      if (
        error instanceof Error &&
        'code' in (error as any) &&
        (error as any).code === 'P2002'
      ) {
        throw new Error('Запись на этот курс уже существует')
      }

      // Для других типов ошибок возвращаем общее сообщение
      throw new Error('Ошибка при создании записи на курс')
    }
  }
}
