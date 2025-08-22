import 'dotenv/config'
import { dbClient } from '../src/shared/lib/db'
import * as path from 'path'
import { contentParser } from '../src/shared/api/content'
import manifestSchema from '../src/shared/api/content/_schemas/manifest.schema.json'
import courseSchema from '../src/shared/api/content/_schemas/course.schema.json'
import dailyPlanSchema from '../src/shared/api/content/_schemas/daily-plan.schema.json'
import workoutSchema from '../src/shared/api/content/_schemas/workout.schema.json'
import mealPlanSchema from '../src/shared/api/content/_schemas/meal-plan.schema.json'
import recipeSchema from '../src/shared/api/content/_schemas/recipe.schema.json'
import { ParsingError, ValidationError } from '../src/shared/lib/errors'
import { Course } from '@/shared/api/content/_schemas/course.schema'

export type KinescopePoster = {
  id: string
  status?: 'done' | 'processing' | 'error'
  active?: boolean
  original: string
  md?: string
  sm?: string
  xs?: string
  [k: string]: unknown
}

type KinescopeVideo = {
  duration?: number | null
  progress?: number | null
  poster?: KinescopePoster | null
}

type Envelope<T> = { data: T }

function unwrap<T>(payload: Envelope<T> | T): T {
  return (payload as Envelope<T>)?.data ?? (payload as T)
}

// Утилита для получения метаданных видео из Kinescope
async function fetchKinescopeVideoMetadata(
  videoId: string
): Promise<KinescopeVideo | null> {
  const apiKey = process.env.KINESCOPE_API_KEY
  if (!apiKey) throw new Error('KINESCOPE_API_KEY is not set')
  try {
    const resp = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })
    if (!resp.ok) {
      console.warn(
        `  🟡 Не удалось получить метаданные Kinescope для videoId=${videoId}: ${resp.status} ${resp.statusText}`
      )
      return null
    }

    const payload = (await resp.json()) as
      | Envelope<KinescopeVideo>
      | KinescopeVideo
    const v = unwrap(payload)

    const duration =
      typeof v.duration === 'number' ? Math.round(v.duration) : undefined
    const progress =
      typeof v.progress === 'number' ? Math.round(v.progress) : undefined
    const poster = v.poster ?? undefined

    return { duration, poster, progress }
  } catch (e) {
    console.warn(
      `  🟡 Ошибка запроса метаданных Kinescope для videoId=${videoId}:`,
      e
    )
    return null
  }
}

// Функция для скачивания и парсинга YAML-файла
async function downloadAndParseValidatedYaml<T>(
  relativePath: string,
  schema: object,
  addSlug: boolean = true,
  explicitSlug?: string
): Promise<T | null> {
  const fetchUrl = `${process.env.CONTENT_URL}/${relativePath}`
  const slug = explicitSlug || path.basename(relativePath, '.yaml')

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `token ${process.env.CONTENT_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`  🟡 Файл не найден по адресу ${fetchUrl}. Пропускаем.`)
        return null
      }
      throw new Error(
        `Ошибка при загрузке ${fetchUrl}: ${response.status} ${response.statusText}`
      )
    }

    const text = await response.text()
    console.log({ text })
    const parsedData = await contentParser.parse<T>(
      text,
      schema,
      addSlug
        ? {
            slug,
          }
        : undefined
    )

    if (addSlug) (parsedData as any).slug = slug

    return parsedData
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`  ❌ Ошибка валидации для ${fetchUrl}:`)
    } else if (error instanceof ParsingError) {
      console.error(`  ❌ Ошибка парсинга для ${fetchUrl}: ${error.message}`)
    } else {
      console.error(
        `  ❌ Непредвиденная ошибка при обработке ${fetchUrl}:`,
        error
      )
    }
    return null
  }
}

// --- Основная функция загрузки и выгрузки контента (ИЗМЕНЕНИЯ ЗДЕСЬ) ---
async function downloadAndUploadContent(): Promise<void> {
  console.log('🚀 Запуск удаленной загрузки и импорта контента...')

  try {
    // --- 0. Загрузка глобального манифеста ---
    const manifestRelativePath = 'manifest.yaml'
    console.log(`\n📄 Загрузка глобального манифеста ...`)
    const globalManifest = await downloadAndParseValidatedYaml<any>(
      manifestRelativePath,
      manifestSchema,
      false
    )

    if (!globalManifest) {
      console.error(
        '🚫 Критическая ошибка: Не удалось загрузить или валидировать глобальный манифест. Импорт отменен.'
      )
      process.exit(1)
    }

    // 1. Импорт всех Workouts
    console.log('\n🏋️ Импорт тренировок (Workouts)...')
    const workoutSlugs: string[] = globalManifest.workouts || []
    for (const slug of workoutSlugs) {
      const relativePath = `workouts/${slug}.yaml`
      const workoutData = await downloadAndParseValidatedYaml<any>(
        relativePath,
        workoutSchema
      )
      if (workoutData) {
        // Получаем метаданные Kinescope до сохранения
         let kinescopeMeta = null as Awaited<ReturnType<typeof fetchKinescopeVideoMetadata>> | null
        if (workoutData.videoId && process.env.KINESCOPE_API_KEY) {
          kinescopeMeta = await fetchKinescopeVideoMetadata(workoutData.videoId)
        }

        await dbClient.workout.upsert({
          where: { slug: workoutData.slug },
          // Приводим тип к any, чтобы избежать конфликтов типов до применения миграции/генерации Prisma
          update: {
            title: workoutData.title,
            type: workoutData.type,
            difficulty: workoutData.difficulty,
            equipment: workoutData.equipment,
            description: workoutData.description,
            videoId: workoutData.videoId,
            muscles: workoutData.muscles,
            // Kinescope metadata
            durationSec: kinescopeMeta?.duration,
            progress: kinescopeMeta?.progress,
            poster: kinescopeMeta?.poster,
            posterUrl: kinescopeMeta?.poster?.original,
          } as any,
          create: {
            slug: workoutData.slug,
            title: workoutData.title,
            type: workoutData.type,
            difficulty: workoutData.difficulty,
            equipment: workoutData.equipment,
            description: workoutData.description,
            videoId: workoutData.videoId,
            muscles: workoutData.muscles,
            // Kinescope metadata
            durationSec: kinescopeMeta?.duration,
            progress: kinescopeMeta?.progress,
            poster: kinescopeMeta?.poster,
            posterUrl: kinescopeMeta?.poster?.original,
          } as any,
        })
        console.log(
          `  ✅ Тренировка импортирована/обновлена: ${workoutData.slug}`
        )
      }
    }

    // 2. Импорт всех Recipes
    console.log('\n🍳 Импорт рецептов (Recipes)...')
    const recipeSlugs: string[] = globalManifest.recipes || []
    for (const slug of recipeSlugs) {
      const relativePath = `recipes/${slug}.yaml`
      const recipeData = await downloadAndParseValidatedYaml<any>(
        relativePath,
        recipeSchema
      )
      if (recipeData) {
        await dbClient.recipe.upsert({
          where: { slug: recipeData.slug },
          update: {
            title: recipeData.title,
            description: recipeData.description,
            preparationTimeMinutes: recipeData.preparationTimeMinutes,
            calories: recipeData.calories,
            servings: recipeData.servings,
            difficulty: recipeData.difficulty,
            isGlutenFree: recipeData.isGlutenFree,
            isSugarFree: recipeData.isSugarFree,
            mealCategories: recipeData.mealCategories,
            ingredients: {
              deleteMany: {},
              create:
                recipeData.ingredients?.map((ing: any) => ({
                  name: ing.name,
                  weightGrams: ing.weightGrams,
                  quantity: ing.quantity,
                  unit: ing.unit,
                })) || [],
            },
          },
          create: {
            slug: recipeData.slug,
            title: recipeData.title,
            description: recipeData.description,
            preparationTimeMinutes: recipeData.preparationTimeMinutes,
            calories: recipeData.calories,
            servings: recipeData.servings,
            difficulty: recipeData.difficulty,
            isGlutenFree: recipeData.isGlutenFree,
            isSugarFree: recipeData.isSugarFree,
            mealCategories: recipeData.mealCategories,
            ingredients: {
              create:
                recipeData.ingredients?.map((ing: any) => ({
                  name: ing.name,
                  weightGrams: ing.weightGrams,
                  quantity: ing.quantity,
                  unit: ing.unit,
                })) || [],
            },
          },
        })
        console.log(`  ✅ Рецепт импортирован/обновлен: ${recipeData.slug}`)
      }
    }

    // 3. Импорт всех Courses (включая вложенные DailyPlans и MealPlans)
    console.log(
      '\n📚 Импорт курсов (Courses), включая вложенные DailyPlans и MealPlans...'
    )
    const courseSlugs: string[] = globalManifest.courses || []
    for (const courseSlug of courseSlugs) {
      const courseRelativePath = `courses/${courseSlug}/course.yaml`
      const courseData = await downloadAndParseValidatedYaml<Course>(
        courseRelativePath,
        courseSchema,
        true,
        courseSlug
      )

      if (!courseData) {
        console.error(
          `  ❌ Не удалось обработать Курс со слагом ${courseSlug}. Пропускаем.`
        )
        continue
      }

      await dbClient.course.upsert({
        where: { slug: courseSlug },
        update: {
          title: courseData.title,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          thumbnail: courseData.thumbnail,
          image: courseData.image,
          draft: courseData.draft,
          durationWeeks: courseData.durationWeeks,
          minWorkoutDaysPerWeek: courseData.minWorkoutDaysPerWeek, // Добавляем это поле
        },
        create: {
          slug: courseSlug,
          title: courseData.title,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          thumbnail: courseData.thumbnail,
          image: courseData.image,
          draft: courseData.draft,
          durationWeeks: courseData.durationWeeks,
          minWorkoutDaysPerWeek: courseData.minWorkoutDaysPerWeek, // Добавляем это поле
        },
      })
      console.log(
        `  ✅ Курс импортирован/обновлен: ${courseData.title} (Slug: ${courseSlug})`
      )

      // 4. Импорт всех MealPlans для текущего курса
      console.log(`  🍽️ Импорт планов питания для курса "${courseSlug}"...`)
      // Предполагаем, что courseData.mealPlanSlugs содержит список слагов планов питания
      const mealPlanSlugs: string[] = courseData.mealPlans || []
      for (const mealPlanSlug of mealPlanSlugs) {
        // Путь: courses/<courseSlug>/meal-plans/<mealPlanSlug>.yaml
        const mealPlanRelativePath = `courses/${courseSlug}/meal-plans/${mealPlanSlug}.yaml`
        const mealPlanData = await downloadAndParseValidatedYaml<any>(
          mealPlanRelativePath,
          mealPlanSchema
        )

        if (mealPlanData) {
          // Убеждаемся, что courseSlug в самом mealPlan.yaml совпадает с текущим courseSlug
          if (mealPlanData.courseSlug !== courseSlug) {
            console.warn(
              `    ⚠️ Предупреждение: courseSlug в файле ${mealPlanRelativePath} (${mealPlanData.courseSlug}) не совпадает со слагом папки курса (${courseSlug}). Используем слаг папки.`
            )
            mealPlanData.courseSlug = courseSlug // Корректируем слаг курса
          }

          const course = await dbClient.course.findUnique({
            where: { slug: mealPlanData.courseSlug },
          })
          if (!course) {
            console.error(
              `    ❌ Ошибка: Курс "${mealPlanData.courseSlug}" не найден для плана питания ${mealPlanData.slug}. Пропускаем.`
            )
            continue
          }

          const breakfastRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.breakfastRecipeId },
          })
          const lunchRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.lunchRecipeId },
          })
          const dinnerRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.dinnerRecipeId },
          })

          if (!breakfastRecipe || !lunchRecipe || !dinnerRecipe) {
            console.error(
              `    ❌ Ошибка: Один или несколько рецептов не найдены для плана питания ${mealPlanData.slug}. Пропускаем.`
            )
            continue
          }

          await dbClient.mealPlan.upsert({
            where: {
              courseId_slug: { courseId: course.id, slug: mealPlanData.slug },
            },
            update: {
              title: mealPlanData.title,
              description: mealPlanData.description,
              breakfastRecipe: { connect: { id: breakfastRecipe.id } },
              lunchRecipe: { connect: { id: lunchRecipe.id } },
              dinnerRecipe: { connect: { id: dinnerRecipe.id } },
            },
            create: {
              slug: mealPlanData.slug,
              title: mealPlanData.title,
              description: mealPlanData.description,
              course: { connect: { id: course.id } },
              breakfastRecipe: { connect: { id: breakfastRecipe.id } },
              lunchRecipe: { connect: { id: lunchRecipe.id } },
              dinnerRecipe: { connect: { id: dinnerRecipe.id } },
            },
          })
          console.log(
            `    ✅ План питания импортирован/обновлен: ${mealPlanData.slug}`
          )
        }
      }

      // 5. Импорт всех DailyPlans для текущего курса
      console.log(`  🗓️ Импорт ежедневных планов для курса "${courseSlug}"...`)
      // Предполагаем, что courseData.dailyPlanSlugs содержит список слагов ежедневных планов
      const dailyPlanSlugs: string[] = courseData.dailyPlans || []
      for (const dailyPlanSlug of dailyPlanSlugs) {
        // Путь: courses/<courseSlug>/daily-plans/<dailyPlanSlug>.yaml
        const dailyPlanRelativePath = `courses/${courseSlug}/daily-plans/${dailyPlanSlug}.yaml`
        const dailyPlanData = await downloadAndParseValidatedYaml<any>(
          dailyPlanRelativePath,
          dailyPlanSchema
        )

        if (dailyPlanData) {
          // Убеждаемся, что courseSlug в самом dailyPlan.yaml совпадает с текущим courseSlug
          if (dailyPlanData.courseSlug !== courseSlug) {
            console.warn(
              `    ⚠️ Предупреждение: courseSlug в файле ${dailyPlanRelativePath} (${dailyPlanData.courseSlug}) не совпадает со слагом папки курса (${courseSlug}). Используем слаг папки.`
            )
            dailyPlanData.courseSlug = courseSlug // Корректируем слаг курса
          }

          const course = await dbClient.course.findUnique({
            where: { slug: dailyPlanData.courseSlug },
          })
          if (!course) {
            console.error(
              `    ❌ Ошибка: Курс "${dailyPlanData.courseSlug}" не найден для ежедневного плана ${dailyPlanData.slug}. Пропускаем.`
            )
            continue
          }

          const warmupWorkout = await dbClient.workout.findUnique({
            where: { slug: dailyPlanData.warmupId },
          })
          const mainWorkout = dailyPlanData.mainWorkoutId
            ? await dbClient.workout.findUnique({
                where: { slug: dailyPlanData.mainWorkoutId },
              })
            : null
          const mealPlan = await dbClient.mealPlan.findUnique({
            where: {
              courseId_slug: {
                // Используем составной ключ, так как mealPlan привязан к курсу
                courseId: course.id,
                slug: dailyPlanData.mealPlanId,
              },
            },
          })

          if (!warmupWorkout) {
            console.error(
              `    ❌ Ошибка: Разминка "${dailyPlanData.warmupId}" не найдена для ежедневного плана ${dailyPlanData.slug}. Пропускаем.`
            )
            continue
          }
          if (dailyPlanData.mainWorkoutId && !mainWorkout) {
            console.error(
              `    ❌ Ошибка: Основная тренировка "${dailyPlanData.mainWorkoutId}" не найдена для ежедневного плана ${dailyPlanData.slug}. Пропускаем.`
            )
            continue
          }
          if (!mealPlan) {
            console.error(
              `    ❌ Ошибка: План питания "${dailyPlanData.mealPlanId}" не найден для ежедневного плана ${dailyPlanData.slug} в курсе ${dailyPlanData.courseSlug}. Пропускаем.`
            )
            continue
          }

          await dbClient.dailyPlan.upsert({
            where: {
              courseId_slug: { courseId: course.id, slug: dailyPlanData.slug },
            },
            update: {
              dayNumber: dailyPlanData.dayNumber,
              weekNumber: dailyPlanData.weekNumber,
              description: dailyPlanData.description,
              warmup: { connect: { id: warmupWorkout.id } },
              mainWorkout: mainWorkout
                ? { connect: { id: mainWorkout.id } }
                : undefined,
              mealPlan: { connect: { id: mealPlan.id } },
              contentBlocks: {
                deleteMany: {},
                create:
                  dailyPlanData.contentBlocks?.map((block: any) => ({
                    type: block.type,
                    text: block.text,
                  })) || [],
              },
            },
            create: {
              slug: dailyPlanData.slug,
              dayNumber: dailyPlanData.dayNumber,
              weekNumber: dailyPlanData.weekNumber,
              description: dailyPlanData.description,
              course: { connect: { id: course.id } },
              warmup: { connect: { id: warmupWorkout.id } },
              mainWorkout: mainWorkout
                ? { connect: { id: mainWorkout.id } }
                : undefined,
              mealPlan: { connect: { id: mealPlan.id } },
              contentBlocks: {
                create:
                  dailyPlanData.contentBlocks?.map((block: any) => ({
                    type: block.type,
                    text: block.text,
                  })) || [],
              },
            },
          })
          console.log(
            `    ✅ Ежедневный план импортирован/обновлен: ${dailyPlanData.slug}`
          )
        }
      }
    } // Конец цикла по курсам

    console.log('\n🎉 Удаленная загрузка и импорт контента завершены!')
  } catch (error) {
    console.error('❌ Произошла непредвиденная ошибка во время импорта:', error)
    process.exit(1)
  } finally {
    await dbClient.$disconnect()
  }
}

downloadAndUploadContent()
  .then(() => console.log('Контент успешно загружен в базу данных!'))
  .catch(error => console.error('Произошла ошибка:', error))
