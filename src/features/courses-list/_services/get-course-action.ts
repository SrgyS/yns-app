import { GetCourseService } from '@/entities/course/module'
import { injectable } from "inversify";
import { CourseAction } from "../_domain/types";
import { CourseId } from "@/kernel/domain/course";
import { TRPCError } from "@trpc/server";
import { UserId } from "@/kernel/domain/user";
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { getCourseAction } from "../_domain/methods";
import { UserCourseEnrollmentRepository } from '@/entities/course/_repositories/user-course-enrollment'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'

type Query = {
  courseId: CourseId;
  userId?: UserId;
};

@injectable()
export class GetCourseActionService {
  constructor(
    private getCourseService: GetCourseService,
    private getCourseAccess: CheckCourseAccessService,
    private userCourseEnrollmentRepository: UserCourseEnrollmentRepository,
    private userAccessRepository: UserAccessRepository,
  ) {}
  async exec(query: Query): Promise<CourseAction> {
    const course = await this.getCourseService.exec({ id: query.courseId });

    if (!course) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Course ${query.courseId} not found`,
      });
    }

    const courseAccess = query.userId
      ? await this.getCourseAccess.exec({
          course: {
            id: course.id,
            contentType: course.contentType,
            product: course.product!,
          },
          userId: query.userId,
        })
      : false;

    let needsSetup = false

    if (courseAccess && query.userId) {
      const userAccess = await this.userAccessRepository.findUserCourseAccess(
        query.userId,
        course.id,
        course.contentType,
      )

      if (course.contentType !== 'SUBSCRIPTION') {
        const setupCompleted = userAccess?.setupCompleted ?? false

        if (!setupCompleted) {
          needsSetup = true
        } else {
          const enrollment = await this.userCourseEnrollmentRepository.getEnrollment(
            query.userId,
            course.id,
          )

          if (!enrollment || enrollment.selectedWorkoutDays.length === 0) {
            needsSetup = true
          }
        }
      }
    }

    return getCourseAction({
      course,
      hasAccess: courseAccess,
      needsSetup,
    });
  }
}
