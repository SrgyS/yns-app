import { CourseId, CourseSlug } from "@/kernel/domain/course";
import { coursesListApi } from "../_api";

export function useCourseAction(courseId: CourseId, courseSlug: CourseSlug) {

  const { data: action, isPending } =
    coursesListApi.coursesList.getAction.useQuery({
      courseId: courseId,
    });

  if (isPending || !action) {
    return {
      type: "pending",
    } as const;
  }

  if (action.type === "buy") {
    return { ...action, href: `/payment/${courseId}` };
  }

  if (action.type === "enter") {
    return { ...action, href: `/day/${courseSlug}` };
  }

  return action;
}