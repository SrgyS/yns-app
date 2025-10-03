import { z } from "zod";

export const createCourseOrderSchema = z.object({
  courseSlug: z.string(),
  urlReturn: z.string(),
});