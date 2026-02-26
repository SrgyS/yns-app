'use client'

import { DayOfWeek } from '@prisma/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { WorkoutDaySelector } from './workout-day-selector'
import {
  useCourseEnrollment,
  useAccessibleEnrollmentsQuery,
} from '@/features/course-enrollment/_vm/use-course-enrollment'
import { ContentType, CourseId, CourseSlug } from '@/kernel/domain/course'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import type { PaidAccessState } from '@/features/course-enrollment/_vm/paid-access-types'

interface SelectWorkoutDaysClientProps {
  initialSelectedDays: DayOfWeek[]
  allowedDayOptions?: number[]
  courseId: CourseId
  courseSlug: CourseSlug
  courseContentType: ContentType
}

export function SelectWorkoutDaysClient({
  courseSlug,
  courseId,
  courseContentType,
  initialSelectedDays,
  allowedDayOptions,
}: Readonly<SelectWorkoutDaysClientProps>) {
  const dayOptions =
    allowedDayOptions && allowedDayOptions.length > 0
      ? Array.from(new Set(allowedDayOptions)).sort((a, b) => a - b)
      : [5]

  const hasChoice = dayOptions.length > 1
  const singleOptionValue = dayOptions[0] ?? 5

  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState<number | null>(
    hasChoice ? null : singleOptionValue
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { createEnrollment, updateWorkoutDays } = useCourseEnrollment()

  const accessibleQuery = useAccessibleEnrollmentsQuery({
    staleTime: 5_000,
  })
  const accessible = accessibleQuery.data as PaidAccessState | undefined

  const initialDaysForSelector =
    targetDaysPerWeek && initialSelectedDays.length === targetDaysPerWeek
      ? initialSelectedDays
      : []

  const handleModeChange = (days: number | null) => {
    if (!hasChoice) return
    setTargetDaysPerWeek(days)
  }

  const handleDaysSelection = async (days: DayOfWeek[]) => {
    if (!targetDaysPerWeek || days.length !== targetDaysPerWeek) {
      return
    }

    setIsSubmitting(true)

    let existingEnrollment: PaidAccessState['accessibleCourses'][number] | null =
      null
    if (accessible && 'accessibleCourses' in accessible) {
      existingEnrollment =
        accessible.accessibleCourses.find(
          (entry: PaidAccessState['accessibleCourses'][number]) =>
            entry.enrollment.courseId === courseId
        ) ?? null
    }

    try {
      if (!existingEnrollment) {
        const refreshed = await accessibleQuery.refetch()
        const refreshedData = refreshed.data as PaidAccessState | undefined
        if (refreshedData) {
          if ('accessibleCourses' in refreshedData) {
            const found = refreshedData.accessibleCourses.find(
              (entry: PaidAccessState['accessibleCourses'][number]) =>
                entry.enrollment.courseId === courseId
            )
            existingEnrollment = null
            if (found !== undefined) {
              existingEnrollment = found
            }
          }
        }
      }

      if (existingEnrollment) {
        await updateWorkoutDays({
          enrollmentId: existingEnrollment.enrollment.id,
          selectedWorkoutDays: days,
          keepProgress: false,
        })
      } else {
        await createEnrollment({
          courseId,
          courseContentType,
          selectedWorkoutDays: days,
          startDate: new Date(),
        })
      }
      setIsSubmitting(false)
      toast.success('План тренировок готов!')
      router.push(`/platform/day/${courseSlug}`)
    } catch (error) {
      console.error('Error handling workout days:', error)
      let errorMessage = 'Не удалось создать запись на курс!'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      setIsSubmitting(false)
      toast.error(errorMessage)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-center">
        Выберите дни тренировок
      </h2>
      {hasChoice ? (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Сначала выберите, сколько тренировок в неделю вы хотите проходить.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            {dayOptions.map(option => (
              <div
                key={option}
                className="flex items-center gap-2 rounded-md border px-4 py-2"
              >
                <Checkbox
                  id={`workouts-${option}`}
                  checked={targetDaysPerWeek === option}
                  onCheckedChange={checked =>
                    handleModeChange(checked ? option : null)
                  }
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor={`workouts-${option}`}
                  className="cursor-pointer select-none"
                  onClick={() =>
                    handleModeChange(
                      targetDaysPerWeek === option ? null : option
                    )
                  }
                >
                  {option} тренировки
                </Label>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          Для этого курса предусмотрено {singleOptionValue ?? 0} тренировок в
          неделю.
        </p>
      )}
      <WorkoutDaySelector
        key={targetDaysPerWeek ?? 'disabled'}
        onSelectDays={handleDaysSelection}
        requiredDays={targetDaysPerWeek ?? 0}
        initialSelectedDays={initialDaysForSelector}
        isLoading={isSubmitting}
        disabled={!targetDaysPerWeek}
      />
    </div>
  )
}
