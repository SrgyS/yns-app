import { injectable } from "inversify";
import { UserId } from "@/kernel/domain/user";
import { ContentType, CourseId } from "@/kernel/domain/course";
import { CourseAccessReason, CourseUserAccess } from "../_domain/type";
import { UserAccessRepository } from "../_repository/user-access";
import { TRPCError } from "@trpc/server";
import { generateId } from "@/shared/lib/id";

type Command = {
  userId: UserId;
  courseId: CourseId;
  reason: CourseAccessReason;
  adminId?: UserId;
  contentType: ContentType;
};

@injectable()
export class GrandCourseAccessService {
  constructor(private userAccessRepository: UserAccessRepository) {}
  async exec(command: Command) {
    const courseAccess = await this.userAccessRepository.findUserCourseAccess(
      command.userId,
      command.courseId,
      command.contentType,
    );

    if (courseAccess) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Course access already exists",
      });
    }

    const newCourseAccess: CourseUserAccess = {
      courseId: command.courseId,
      userId: command.userId,
      contentType: command.contentType,
      reason: command.reason,
      adminId: command.adminId,
      id: generateId(),
    };

    return this.userAccessRepository.save(newCourseAccess);
  }
}