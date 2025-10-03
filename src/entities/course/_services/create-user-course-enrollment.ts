import { injectable } from 'inversify'
import { UserCourseEnrollmentRepository } from '../_repositories/user-course-enrollment'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CreateUserCourseEnrollmentParams, UserCourseEnrollment } from '..'
import { logger } from '@/shared/lib/logger'
import { dbClient } from '@/shared/lib/db'
import { GetCourseService } from './get-course'
import { CheckCourseAccessService } from '@/entities/user-access/module'

@injectable()
export class CreateUserCourseEnrollmentService {
  constructor(
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userDailyPlanRepository: UserDailyPlanRepository,
    private getCourseService: GetCourseService,
    private checkCourseAccess: CheckCourseAccessService
  ) {}

  async exec(
    params: CreateUserCourseEnrollmentParams
  ): Promise<UserCourseEnrollment> {
    try {
      // Проверяем доступ пользователя к курсу перед созданием enrollment
      const course = await this.getCourseService.exec({ id: params.courseId })
      if (!course) {
        throw new Error('Курс не найден')
      }

      if (!course.product) {
        throw new Error('Некорректные данные курса: отсутствует продукт')
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
        throw new Error('Нет доступа к курсу')
      }

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

        // Проверяем, есть ли уже запись для этого пользователя и курса
        const existingEnrollment = await this.userCourseEnrollmentRepository.getEnrollment(
          params.userId,
          params.courseId
        )

        let enrollment: UserCourseEnrollment

        if (existingEnrollment) {
          console.log('exist')
          // Реактивируем существующую запись с новыми параметрами
          enrollment = await this.userCourseEnrollmentRepository.reactivateEnrollment(
            existingEnrollment.id,
            {
              startDate: params.startDate,
              selectedWorkoutDays: params.selectedWorkoutDays,
              hasFeedback: params.hasFeedback,
            },
            tx
          )
        } else {
          // Создаем новую запись только если её нет
          const newEnrollment = await tx.userCourseEnrollment.create({
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

          enrollment = {
            id: newEnrollment.id,
            userId: newEnrollment.userId,
            courseId: newEnrollment.courseId,
            selectedWorkoutDays: newEnrollment.selectedWorkoutDays,
            startDate: newEnrollment.startDate,
            hasFeedback: newEnrollment.hasFeedback,
            active: newEnrollment.active,
            course: {
              id: newEnrollment.course.id,
              slug: newEnrollment.course.slug,
              title: newEnrollment.course.title,
            },
          }
        }

        // Обновляем UserAccess, связывая его с enrollment
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

        return enrollment
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
