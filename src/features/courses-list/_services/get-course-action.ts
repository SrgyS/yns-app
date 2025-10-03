import { GetCourseService } from '@/entities/course/module'
import { injectable } from "inversify";
import { CourseAction } from "../_domain/types";
import { CourseId } from "@/kernel/domain/course";
import { TRPCError } from "@trpc/server";
import { UserId } from "@/kernel/domain/user";
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { getCourseAction } from "../_domain/methods";

type Query = {
  courseId: CourseId;
  userId?: UserId;
};

@injectable()
export class GetCourseActionService {
  constructor(
    private getCourseService: GetCourseService,
    private getCourseAccess: CheckCourseAccessService,
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

    return getCourseAction({
      course,
      hasAccess: courseAccess,
    });
  }
}