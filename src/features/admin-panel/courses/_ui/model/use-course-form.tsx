import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { skipToken } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CourseContentType, AccessType } from '@prisma/client'

import { adminCoursesApi } from '../../_api'
import type { CourseUpsertInput } from '../../_schemas'
import { courseFormSchema, CourseFormValues } from './schema'
import { CourseTariff } from '@/kernel/domain/course'

export function useCourseForm(editSlug?: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlSlug = searchParams.get('slug')
  const effectiveEditSlug = editSlug ?? urlSlug

  const [isPending, startTransition] = useTransition()
  const [courseId, setCourseId] = useState<string | null>(null)

  const courseQuery = adminCoursesApi.adminCourses.course.get.useQuery(
    effectiveEditSlug ? { slug: effectiveEditSlug } : skipToken
  )

  const upsertCourse = adminCoursesApi.adminCourses.course.upsert.useMutation({
    onSuccess: result => {
      toast.success(courseId ? 'Курс сохранён' : 'Курс успешно создан')
      router.push(`/admin/courses/${result.slug}/daily-plan`)
    },
    onError: () => {
      toast.error('Ошибка при создании курса')
    },
  })

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      contentType: CourseContentType.FIXED_COURSE,
      tariffs: [
        {
          access: AccessType.paid,
          price: 1,
          durationDays: 1,
          feedback: false,
        },
      ],
      durationWeeks: 4,
      allowedWorkoutDaysPerWeek: [5],
      thumbnail: '',
      image: '',
      weeks: [],
    },
  })

  useEffect(() => {
    if (!courseQuery.data) return
    const courseData = courseQuery.data
    setCourseId(courseData.id)

    const tariffsWithId: CourseTariff[] = courseData.tariffs
      .filter((tariff): tariff is typeof tariff & { id: string } =>
        Boolean(tariff.id)
      )
      .map(tariff => ({
        id: tariff.id,
        access: tariff.access,
        price: tariff.price,
        durationDays: tariff.durationDays,
        feedback: tariff.feedback ?? false,
      }))

    const tariffsFormValues =
      tariffsWithId.length > 0
        ? tariffsWithId.map(tariff => ({
            access: AccessType.paid,
            price: tariff.price,
            durationDays: tariff.durationDays,
            feedback: tariff.feedback ?? false,
          }))
        : [
            {
              access: AccessType.paid,
              price: 1,
              durationDays: 1,
              feedback: false,
            },
          ]

    const existingWeeks =
      courseData.weeks?.map(week => ({
        id: week.id,
        weekNumber: week.weekNumber,
        releaseAt: week.releaseAt ?? new Date().toISOString(),
      })) ?? []

    // If subscription, use existing weeks or generate placeholders based on durationWeeks
    const initialWeeks =
      existingWeeks.length > 0
        ? existingWeeks
        : Array.from({ length: courseData.durationWeeks }).map((_, idx) => ({
            weekNumber: idx + 1,
            releaseAt: new Date().toISOString(),
          }))

    form.reset({
      title: courseData.title,
      slug: courseData.slug,
      description: courseData.description,
      shortDescription: courseData.shortDescription ?? '',
      contentType: courseData.contentType as CourseContentType,
      tariffs: tariffsFormValues,
      durationWeeks: courseData.durationWeeks,
      allowedWorkoutDaysPerWeek: courseData.allowedWorkoutDaysPerWeek ?? [5],
      thumbnail: courseData.thumbnail ?? '',
      image: courseData.image ?? '',
      weeks: initialWeeks,
    })

    // Force update fields that might be stuck due to Select component behavior
    if (courseData.contentType) {
      form.setValue('contentType', courseData.contentType as CourseContentType)
    }
  }, [courseQuery.data, form])

  const onSubmit = (data: CourseFormValues) => {
    startTransition(async () => {
      try {
        const thumbnailPath = data.thumbnail ?? ''
        const imagePath = data.image ?? ''
        const preservedDependencies = courseQuery.data?.dependencies ?? []
        const preservedMealPlans = courseQuery.data?.mealPlans ?? []
        const preservedDailyPlans =
          courseQuery.data?.dailyPlans?.map(plan => ({
            ...plan,
            warmupId: plan.warmupId || null,
          })) ?? []

        const tariffs: CourseUpsertInput['tariffs'] = data.tariffs.map(
          tariff => {
            return {
              access: 'paid',
              price: Number(tariff.price),
              durationDays: Number(tariff.durationDays),
              feedback: tariff.feedback ?? false,
            }
          }
        )

        // Prepare weeks based on current state
        // data.weeks is already populated via useFieldArray in the UI
        const weeksPayload =
          data.contentType === CourseContentType.SUBSCRIPTION
            ? data.weeks.map(week => ({
                id: week.id,
                weekNumber: week.weekNumber,
                releaseAt: week.releaseAt,
              }))
            : []

        await upsertCourse.mutateAsync({
          slug: data.slug,
          title: data.title,
          description: data.description,
          shortDescription: data.shortDescription ?? null,
          thumbnail: thumbnailPath || null,
          image: imagePath || null,
          draft: true,
          durationWeeks: data.durationWeeks,
          allowedWorkoutDaysPerWeek: data.allowedWorkoutDaysPerWeek,
          contentType: data.contentType,
          tariffs,
          dependencies: preservedDependencies,
          weeks: weeksPayload,
          mealPlans: preservedMealPlans,
          dailyPlans: preservedDailyPlans,
          id: courseId ?? undefined,
        })
      } catch (error) {
        console.error(error)
      }
    })
  }

  return {
    form,
    onSubmit,
    isSubmitting: isPending || upsertCourse.isPending,
    isLoadingPrefill: courseQuery.isLoading,
    courseId,
    courseQuery,
  }
}
