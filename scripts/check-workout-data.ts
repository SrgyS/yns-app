// check-workout-data.ts
// import { PrismaClient } from '@prisma/client'

// async function main() {
//   const prisma = new PrismaClient()

//   const workouts = await prisma.workout.findMany({
//     select: {
//       id: true,
//       slug: true,
//       title: true,
//       type: true
//     }
//   })

//   console.log('Тренировки в базе данных:', workouts)

//   // Проверяем, какие тренировки из манифеста есть в базе данных
//   const workoutSlugs = workouts.map(w => w.slug)
//   console.log('Слаги тренировок в БД:', workoutSlugs)

//   await prisma.$disconnect()
// }

// main().catch(e => {
//   console.error(e)
// })
