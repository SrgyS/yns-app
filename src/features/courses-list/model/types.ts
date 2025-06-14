export type CourseListElement = {
  id: string
  name: string
  description: string
  //   image: string
  //   price: number
  //   rating: number
  //   reviewsCount: number
}

export type CreateCourseListElementCommand = {
  name: string
  description: string
  // image: string
  // price: number
  // rating: number
  // reviewsCount: number
}

export type DeleteCourseListElementCommand = {
  id: string
}
