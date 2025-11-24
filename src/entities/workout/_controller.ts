import { injectable } from 'inversify'
import { z } from 'zod'
import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { ListWorkoutsService } from './_services/list-workouts'
import { WorkoutSection, WorkoutSubsection } from '@prisma/client'
import { GetAccessibleEnrollmentsService } from '@/features/course-enrollment/_services/get-accessible-enrollments'
import { TRPCError } from '@trpc/server'

const listInputSchema = z.object({
  section: z.nativeEnum(WorkoutSection),
  subsection: z.nativeEnum(WorkoutSubsection).optional().nullable(),
  search: z.string().optional().nullable(),
})

@injectable()
export class WorkoutCatalogController extends Controller {
  constructor(
    private readonly listWorkoutsService: ListWorkoutsService,
    private readonly getAccessibleEnrollmentsService: GetAccessibleEnrollmentsService
  ) {
    super()
  }

  public router = router({
    workoutCatalog: router({
      listBySection: authorizedProcedure
        .input(listInputSchema)
        .query(async ({ input, ctx }) => {
          const userId = ctx.session.user.id

          const accessibleEnrollments =
            await this.getAccessibleEnrollmentsService.exec(userId)

          if (accessibleEnrollments.length === 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Нет купленных курсов',
            })
          }

          const normalizedSearch =
            input.search && input.search.trim().length > 0
              ? input.search.trim()
              : undefined

          const workouts = await this.listWorkoutsService.exec({
            section: input.section,
            subsection: input.subsection ?? undefined,
            search: normalizedSearch,
          })

          return workouts
        }),
    }),
  })
}
