import { injectable } from "inversify";
import { UserAccessRepository } from "../_repository/user-access";
import { UserId } from "@/kernel/domain/user";
import { ContentType, CourseId, CourseProduct } from "@/kernel/domain/course";

export type Query = {
  userId: UserId;
  course: {
    id: CourseId;
    product: CourseProduct;
    contentType: ContentType;
  };
};

@injectable()
export class CheckCourseAccessService {
  constructor(private userAccessRepository: UserAccessRepository) {}
  async exec(query: Query) {
    if (query.course.product.access === "free") {
      return true;
    }

    return !!(await this.userAccessRepository.findUserCourseAccess(
      query.userId,
      query.course.id,
      query.course.contentType,
    ));
  }
}