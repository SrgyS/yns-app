import { injectable } from 'inversify'
import { z } from 'zod'
import { Controller, publicProcedure, router } from '@/kernel/lib/trpc/module'
import { GetCoursesListService } from '@/entities/course/module'
import { GetCourseActionService } from './_services/get-course-action'

@injectable()
export class CoursesListController extends Controller {
  constructor(
    private getCoursesListService: GetCoursesListService,
    private getCourseActionService: GetCourseActionService
  ) {
    super()
  }

  public router = router({
    coursesList: {
      get: publicProcedure.query(async () => {
        const coursesList = await this.getCoursesListService.exec()
        return coursesList
      }),
      getAction: publicProcedure
        .input(z.object({ courseId: z.string() }))
        .query(({ input, ctx }) => {
          return this.getCourseActionService.exec({
            courseId: input.courseId,
            userId: ctx.session?.user.id,
          })
        }),
    },
  })
}
