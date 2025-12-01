'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { CourseContentType, AccessType } from '@prisma/client'

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
    thumbnail: z.string().optional(),
    image: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isPaid = data.access === AccessType.paid
    const hasPrice =
      typeof data.price === 'number' && Number.isFinite(data.price)
    if (isPaid && !hasPrice) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'Укажите цену для платного курса',
      })
    }
  })

type CourseFormValues = z.infer<typeof courseFormSchema>

export function CreateCourseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const upsertCourse = adminCoursesApi.adminCourses.course.upsert.useMutation({
    onSuccess: () => {
      toast.success('Курс успешно создан')
      router.push('/admin/courses')
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
      price: 0,
      durationWeeks: 4,
      thumbnail: '',
      image: '',
    },
  })

  const onSubmit = (data: CourseFormValues) => {
    startTransition(async () => {
      try {
        const thumbnailPath = data.thumbnail ?? ''
        const imagePath = data.image ?? ''

        let product

        if (data.access === AccessType.paid) {
          product = {
            access: 'paid' as const,
            price: Number(data.price),
            accessDurationDays: data.accessDurationDays!,
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
          thumbnail: thumbnailPath,
          image: imagePath,
          draft: true,
          durationWeeks: data.durationWeeks,
          allowedWorkoutDaysPerWeek: [5],
          contentType: data.contentType,
          product,
          dependencies: [],
          weeks: [],
          mealPlans: [],
          dailyPlans: [],
        })
      } catch (error) {
        console.error(error)
        toast.error('Ошибка при создании курса')
      }
    })
  }

  const access = form.watch('access')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создание нового курса</CardTitle>
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
                      <Input {...field} className="h-11 text-base" />
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
                      <Input {...field} className="h-11 text-base" />
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
                    onChange={path => field.onChange(path ?? '')}
                    disabled={isSubmitting}
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
                    onChange={path => field.onChange(path ?? '')}
                    disabled={isSubmitting}
                  />
                )}
              />
            </div>

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
                      <Input type="number" min={1} {...field} />
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
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена (₽)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                Создать курс
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
