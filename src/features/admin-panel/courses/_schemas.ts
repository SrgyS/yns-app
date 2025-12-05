import { z } from 'zod'

const accessProductSchema = z.discriminatedUnion('access', [
  z.object({ access: z.literal('free') }),
  z.object({
    access: z.literal('paid'),
    price: z.number().int().positive(),
    accessDurationDays: z.number().int().positive(),
  }),
])

const weekSchema = z.object({
  id: z.string().min(1).optional(),
  weekNumber: z.number().int().min(1),
  releaseAt: z.string().datetime(),
})

const mealPlanSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  breakfastRecipeId: z.string().min(1),
  lunchRecipeId: z.string().min(1),
  dinnerRecipeId: z.string().min(1),
})

const contentBlockSchema = z.object({
  id: z.string().min(1).optional(),
  type: z.literal('text'),
  text: z.string().optional().nullable(),
})

const dailyPlanSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  weekNumber: z.number().int().min(1),
  dayNumberInWeek: z.number().int().min(1).max(7),
  description: z.string().optional().nullable(),
  warmupId: z.string().min(1),
  mainWorkoutId: z.string().optional().nullable(),
  mealPlanId: z.string().optional().nullable(),
  contentBlocks: z.array(contentBlockSchema).default([]),
})

const courseBaseSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional().nullable(),
  thumbnail: z.string().min(1).optional().nullable(),
  image: z.string().min(1).optional().nullable(),
  draft: z.boolean().default(true),
  durationWeeks: z.number().int().min(1),
  allowedWorkoutDaysPerWeek: z
    .array(z.number().int().min(1).max(7))
    .min(1),
  contentType: z.enum(['FIXED_COURSE', 'SUBSCRIPTION']),
  product: accessProductSchema,
  dependencies: z.array(z.string().min(1)).default([]),
})

export const courseUpsertInputSchema = courseBaseSchema.extend({
  weeks: z.array(weekSchema).default([]),
  mealPlans: z.array(mealPlanSchema).default([]),
  dailyPlans: z.array(dailyPlanSchema).default([]),
})

export const dailyPlanUpdateSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional().nullable(),
  warmupId: z.string().min(1),
  mainWorkoutId: z.string().optional().nullable(),
  mealPlanId: z.string().optional().nullable(),
})

export const courseQuerySchema = z
  .object({
    id: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  })
  .refine(
    payload => Boolean(payload.id || payload.slug),
    'Нужно указать id или slug курса'
  )

export const lookupQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  take: z.number().int().min(1).max(50).default(20),
})

export type CourseUpsertInput = z.infer<typeof courseUpsertInputSchema>
export type CourseQueryInput = z.infer<typeof courseQuerySchema>
export type LookupQueryInput = z.infer<typeof lookupQuerySchema>
export type DailyPlanUpdateInput = z.infer<typeof dailyPlanUpdateSchema>
