'use client'

import { DayOfWeek } from '@/shared/lib/client-enums'
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
  readonly initialSelectedDays: DayOfWeek[]
  readonly allowedDayOptions?: number[]
  readonly courseId: CourseId
  readonly courseSlug: CourseSlug
  readonly courseContentType: ContentType
}

function findEnrollmentByCourseId(
  data: PaidAccessState | undefined,
  courseId: CourseId
): PaidAccessState['accessibleCourses'][number] | null {
  if (!data || !('accessibleCourses' in data)) {
    return null
  }

  const found = data.accessibleCourses.find(
    (entry: PaidAccessState['accessibleCourses'][number]) =>
      entry.enrollment.courseId === courseId
  )

  return found ?? null
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

    let existingEnrollment = findEnrollmentByCourseId(accessible, courseId)

    try {
      if (!existingEnrollment) {
        const refreshed = await accessibleQuery.refetch()
        const refreshedData = refreshed.data as PaidAccessState | undefined
        existingEnrollment = findEnrollmentByCourseId(refreshedData, courseId)
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
      toast.success('План тренировок готов!')
      router.push(`/platform/day/${courseSlug}`)
    } catch (error) {
      console.error('Error handling workout days:', error)
      let errorMessage = 'Не удалось создать запись на курс!'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
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
