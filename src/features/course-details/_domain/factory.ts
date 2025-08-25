import { Course } from "@/entity/course";
import { CourseDetails } from "./types";

export const createCourseDetails = (
  course: Course,
): CourseDetails => {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    image: course.image,
  };
};