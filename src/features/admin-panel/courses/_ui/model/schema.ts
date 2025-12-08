import { z } from 'zod'
import { CourseContentType, AccessType } from '@prisma/client'

export const weekSchema = z.object({
  id: z.string().optional(),
  weekNumber: z.number().int().min(1),
  releaseAt: z.string().datetime(),
})

export const courseFormSchema = z
  .object({
    title: z.string().min(1, 'Название обязательно'),
    slug: z
      .string()
      .min(1, 'Slug обязателен')
      .regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефис'),
    description: z.string().min(1, 'Описание обязательно'),
    shortDescription: z.string().optional(),
    contentType: z.nativeEnum(CourseContentType),
    access: z.nativeEnum(AccessType),
    price: z.coerce
      .number()
      .min(0, 'Цена должна быть неотрицательной')
      .optional(),
    durationWeeks: z.coerce.number().min(1, 'Минимум 1 неделя'),
    accessDurationDays: z.coerce
      .number()
      .int()
      .min(1, 'Укажите длительность доступа (в днях)')
      .optional(),
    allowedWorkoutDaysPerWeek: z
      .array(
        z.coerce
          .number()
          .int()
          .min(1, 'Минимум 1 тренировка в неделю')
          .max(7, 'Не больше 7 дней')
      )
      .min(1, 'Укажите число тренировок в неделю'),
    thumbnail: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    // Removed .default([]) to avoid Input/Output mismatch. 
    // We already provide defaultValues: { weeks: [] } in useForm.
    weeks: z.array(weekSchema),
  })
  .superRefine((data, ctx) => {
    const isPaid = data.access === AccessType.paid

    const hasPrice =
      typeof data.price === 'number' && Number.isFinite(data.price)

    const hasAccessDuration =
      typeof data.accessDurationDays === 'number' &&
      Number.isFinite(data.accessDurationDays) &&
      data.accessDurationDays > 0

    if (isPaid && !hasPrice) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'Укажите цену для платного курса',
      })
    }

    if (isPaid && !hasAccessDuration) {
      ctx.addIssue({
        code: 'custom',
        path: ['accessDurationDays'],
        message: 'Укажите длительность доступа',
      })
    }
  })

export type CourseFormValues = z.infer<typeof courseFormSchema>
