import { CourseId, CourseSlug } from "@/kernel/domain/course";
import { useAppSession } from "@/kernel/lib/next-auth/client";
import { coursesListApi } from "../_api";

export function useCourseAction(courseId: CourseId, courseSlug: CourseSlug) {
  const session = useAppSession();

  const { data: action, isPending } =
    coursesListApi.coursesList.getAction.useQuery({
      courseId: courseId,
    });

  if (session.status === "loading" || isPending) {
    return {
      type: "pending",
    } as const;
  }

  if (!action) {
    return { type: "pending" } as const;
  }

  if (action.type === "buy") {
    return { ...action, href: `/select-workout-days/${courseId}` };
  }

  if (action.type === "enter") {
    return { ...action, href: `/day/${courseSlug}` };
  }

  return action;
}