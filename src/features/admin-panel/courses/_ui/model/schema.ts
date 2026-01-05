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
    durationWeeks: z.coerce.number().min(1, 'Минимум 1 неделя'),
    tariffs: z
      .array(
        z
          .object({
            access: z.literal(AccessType.paid),
            price: z.coerce.number().min(1, 'Укажите цену для тарифа'),
            durationDays: z.coerce
              .number()
              .int()
              .min(1, 'Укажите длительность доступа'),
            feedback: z.boolean().optional(),
          })
      )
      .min(1, 'Нужен хотя бы один тариф'),
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

export type CourseFormValues = z.infer<typeof courseFormSchema>
