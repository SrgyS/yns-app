import { z } from 'zod'
import {
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'

export const workoutUpsertInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  videoId: z.string().min(1),
  section: z.nativeEnum(WorkoutSection),
  subsections: z.array(z.nativeEnum(WorkoutSubsection)).default([]),
  muscles: z.array(z.nativeEnum(MuscleGroup)).default([]),
  equipment: z.array(z.string().trim()).default([]),
  difficulty: z.nativeEnum(WorkoutDifficulty),
})

export const workoutIdSchema = z
  .object({
    id: z.string().min(1),
  })

export const workoutLookupQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  take: z.number().int().min(1).max(50).default(20),
})

export const syncInputSchema = z.object({
  folderId: z.string().optional(),
  overwriteManuallyEdited: z.boolean().default(false),
})

export const workoutListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.coerce.number().int().min(1).optional(),
  search: z.string().trim().optional().default(''),
  status: z.enum(['all', 'needsReview', 'ready']).default('all'),
  section: z.nativeEnum(WorkoutSection).optional(),
  difficulty: z.nativeEnum(WorkoutDifficulty).optional(),
  sortDir: z.enum(['desc', 'asc']).default('desc'),
})

export type WorkoutUpsertInput = z.infer<typeof workoutUpsertInputSchema>
export type WorkoutIdInput = z.infer<typeof workoutIdSchema>
export type WorkoutLookupInput = z.infer<typeof workoutLookupQuerySchema>
export type SyncInput = z.infer<typeof syncInputSchema>
export type WorkoutListQuery = z.infer<typeof workoutListQuerySchema>
