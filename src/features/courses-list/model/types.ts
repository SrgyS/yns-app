type CourseListElement = {
  id: string
  name: string
  description: string
  //   image: string
  //   price: number
  //   rating: number
  //   reviewsCount: number
}

type CreateCourseListElementCommand = {
  name: string
  description: string
  // image: string
  // price: number
  // rating: number
  // reviewsCount: number
}

type DeleteCourseListElementCommand = {
  id: string
}
