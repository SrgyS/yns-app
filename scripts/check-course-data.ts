// check-course-data.ts
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  
  const courses = await prisma.course.findMany({
    select: {
      slug: true,
      title: true,
      allowedWorkoutDaysPerWeek: true,
    }
  })
  
  console.log('Курсы в базе данных:', courses)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
