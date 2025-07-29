import { CourseId, CourseSlug } from "@/kernel/domain/course";

export type Course ={
  id: CourseId;
  slug: CourseSlug;
  title: string;
  description: string;
  shortDescription?:string;
  thumbnail: string;
  image: string;
  draft: boolean;
  durationWeeks: number;
  // Теперь это массив ID курсов, от которых зависит данный курс
  dependencies: CourseId[];
  product?: CourseProduct;
}
export type CourseProduct =
  | {
      access: "free";
    }
  | {
      access: "paid";
      price: number;
    };