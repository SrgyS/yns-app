import { Course } from "@/entity/course";
import { CourseAction } from "./types";

export async function getCourseAction({
  course,
  hasAccess,
}: {
  course: Course;
  hasAccess?: boolean;
}): Promise<CourseAction> {
  if (!hasAccess && course.product && course.product.access === "paid") {
    return {
      type: "buy",
      price: course.product.price,
    };
  }

  // Если курс в черновике, показываем "скоро"
  if (course.draft) {
    return {
      type: "comming-soon",
    };
  }

  // Иначе можно входить
  return {
    type: "enter",
  };
}