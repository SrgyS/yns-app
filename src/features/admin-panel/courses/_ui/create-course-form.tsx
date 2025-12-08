'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { CourseContentType, AccessType } from '@prisma/client'
import { skipToken } from '@tanstack/react-query'

import { Button } from '@/shared/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { toast } from 'sonner'
import { Spinner } from '@/shared/ui/spinner'
import { adminCoursesApi } from '../_api'
import { CourseImgField } from './course-img-field'

const courseFormSchema = z
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

type CourseFormValues = z.infer<typeof courseFormSchema>

type CreateCourseFormProps = {
  editSlug?: string
}

export function CreateCourseForm({
  editSlug,
}: Readonly<CreateCourseFormProps>) {
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

  const isSubmitting = isPending || upsertCourse.isPending

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      contentType: CourseContentType.FIXED_COURSE,
      access: AccessType.paid,
      price: undefined,
      accessDurationDays: undefined,
      durationWeeks: 4,
      allowedWorkoutDaysPerWeek: [5],
      thumbnail: '',
      image: '',
    },
  })

  useEffect(() => {
    if (!courseQuery.data) return
    const data = courseQuery.data
    setCourseId(data.id)

    const isPaid = data.product.access === 'paid'
    const paidProduct = isPaid
      ? (data.product as Extract<typeof data.product, { access: 'paid' }>)
      : null
    form.reset({
      title: data.title,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription ?? '',
      contentType: data.contentType as CourseContentType,
      access: isPaid ? AccessType.paid : AccessType.free,
      price: paidProduct?.price ?? undefined,
      accessDurationDays: paidProduct?.accessDurationDays ?? undefined,
      durationWeeks: data.durationWeeks,
      allowedWorkoutDaysPerWeek: data.allowedWorkoutDaysPerWeek ?? [5],
      thumbnail: data.thumbnail ?? '',
      image: data.image ?? '',
    })
  }, [courseQuery.data, form])

  const isLoadingPrefill = courseQuery.isLoading

  const onSubmit = (data: CourseFormValues) => {
    startTransition(async () => {
      try {
        const thumbnailPath = data.thumbnail ?? ''
        const imagePath = data.image ?? ''
        const preservedDependencies = courseQuery.data?.dependencies ?? []
        const preservedWeeks = courseQuery.data?.weeks ?? []
        const preservedMealPlans = courseQuery.data?.mealPlans ?? []
        const preservedDailyPlans =
          courseQuery.data?.dailyPlans?.map(plan => ({
            ...plan,
            warmupId: plan.warmupId || null,
          })) ?? []

        let product

        if (data.access === AccessType.paid) {
          product = {
            access: 'paid' as const,
            price: Number(data.price),
            accessDurationDays: Number(data.accessDurationDays),
          }
        } else {
          product = {
            access: 'free' as const,
          }
        }
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
          product,
          dependencies: preservedDependencies,
          weeks: preservedWeeks,
          mealPlans: preservedMealPlans,
          dailyPlans: preservedDailyPlans,
          id: courseId ?? undefined,
        })
      } catch (error) {
        console.error(error)
      }
    })
  }

  const access = form.watch('access')
  const allowedWorkoutDays = form.watch('allowedWorkoutDaysPerWeek')

  const toggleAllowedDay = (day: number) => {
    const current = form.getValues('allowedWorkoutDaysPerWeek')
    if (current.includes(day)) {
      form.setValue(
        'allowedWorkoutDaysPerWeek',
        current.filter(value => value !== day),
        { shouldValidate: true }
      )
      return
    }

    form.setValue(
      'allowedWorkoutDaysPerWeek',
      [...current, day].sort((a, b) => a - b),
      { shouldValidate: true }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {courseId ? 'Редактирование курса' : 'Создание нового курса'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название курса</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 text-base"
                        disabled={isSubmitting || isLoadingPrefill}
                      />
                    </FormControl>
                    <FormDescription className="min-h-10">
                      Заголовок, который увидят пользователи в карточках и на
                      странице курса.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL адрес)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 text-base"
                        disabled={isSubmitting || isLoadingPrefill}
                      />
                    </FormControl>
                    <FormDescription className="min-h-10">
                      Уникальный идентификатор курса в URL. Только латиница,
                      цифры и дефис.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Подробное описание курса..."
                      className="min-h-30"
                      {...field}
                      disabled={isSubmitting || isLoadingPrefill}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Краткое описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Краткое описание для карточки..."
                      className="min-h-30"
                      {...field}
                      disabled={isSubmitting || isLoadingPrefill}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <CourseImgField
                    label="Миниатюра (Thumbnail)"
                    tag="course-thumbnail"
                    value={field.value ?? null}
                    initialValue={courseQuery.data?.thumbnail ?? null}
                    onChange={path => field.onChange(path)}
                    disabled={isSubmitting || isLoadingPrefill}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <CourseImgField
                    label="Основное изображение"
                    tag="course-image"
                    value={field.value ?? null}
                    initialValue={courseQuery.data?.image ?? null}
                    onChange={path => field.onChange(path)}
                    disabled={isSubmitting || isLoadingPrefill}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allowedWorkoutDaysPerWeek"
              render={() => (
                <FormItem>
                  <FormLabel>Число тренировок в неделю</FormLabel>
                  <FormDescription className="min-h-10">
                    Выберите варианты (например, 3, 4, 5). Максимум из выбранных
                    значений будет использоваться как требование по количеству
                    основных тренировок.
                  </FormDescription>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const dayValue = idx + 1
                      const checked = allowedWorkoutDays?.includes(dayValue)

                      return (
                        <label
                          key={dayValue}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleAllowedDay(dayValue)}
                            disabled={isSubmitting || isLoadingPrefill}
                          />
                          <span>{dayValue} дн/нед</span>
                        </label>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип курса</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting || isLoadingPrefill}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CourseContentType.SUBSCRIPTION}>
                          Подписка
                        </SelectItem>
                        <SelectItem value={CourseContentType.FIXED_COURSE}>
                          Фиксированный курс
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationWeeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Длительность (недель)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        disabled={isSubmitting || isLoadingPrefill}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="access"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Доступ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting || isLoadingPrefill}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите доступ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AccessType.paid}>Платный</SelectItem>
                        <SelectItem value={AccessType.free}>
                          Бесплатный
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {access === AccessType.paid && (
              <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена (₽)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmitting || isLoadingPrefill}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accessDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Длительность доступа (дни)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step="1"
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmitting || isLoadingPrefill}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting || isLoadingPrefill}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingPrefill}>
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                {courseId ? 'Сохранить и далее' : 'Далее'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
