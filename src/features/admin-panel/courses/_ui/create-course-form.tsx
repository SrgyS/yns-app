'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Image from 'next/image'
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
import { createCourseAction } from '../_actions/create-course'
import { uploadCourseImageAction } from '../_actions/upload-course-image'
import { Spinner } from '@/shared/ui/spinner'

const courseFormSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен').regex(/^[a-z0-9-]+$/, 'Только латинские буквы, цифры и дефис'),
  description: z.string().min(1, 'Описание обязательно'),
  shortDescription: z.string().optional(),
  contentType: z.nativeEnum(CourseContentType),
  access: z.nativeEnum(AccessType),
  price: z.coerce.number().min(0).optional(),
  durationWeeks: z.coerce.number().min(1, 'Минимум 1 неделя'),
  thumbnail: z.any().optional(), // File object
  image: z.any().optional(), // File object
})

type CourseFormValues = z.infer<typeof courseFormSchema>

export function CreateCourseForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    },
  })

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: any,
    setPreview: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      field.onChange(file)
      const url = URL.createObjectURL(file)
      setPreview(url)
    }
  }

  const onSubmit = (data: CourseFormValues) => {
    startTransition(async () => {
      try {
        let thumbnailPath = ''
        let imagePath = ''

        if (data.thumbnail instanceof File) {
            const formData = new FormData()
            formData.append('file', data.thumbnail)
            formData.append('tag', 'course-thumbnail')
            const res = await uploadCourseImageAction(formData)
            thumbnailPath = res.path
        }

        if (data.image instanceof File) {
            const formData = new FormData()
            formData.append('file', data.image)
            formData.append('tag', 'course-image')
            const res = await uploadCourseImageAction(formData)
            imagePath = res.path
        }

        await createCourseAction({
            ...data,
            thumbnail: thumbnailPath,
            image: imagePath,
        })
        
        toast.success('Курс успешно создан')
        router.push('/admin/courses')
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
                      <Input {...field} />
                    </FormControl>
                    <FormDescription className="min-h-10">
                      Заголовок, который увидят пользователи в карточках и на странице курса.
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
                      <Input {...field} />
                    </FormControl>
                    <FormDescription className="min-h-10">
                      Уникальный идентификатор курса в URL. Только латиница, цифры и дефис.
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
                      className="min-h-[120px]"
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
                    render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                        <FormLabel>Миниатюра (Thumbnail)</FormLabel>
                        <FormControl>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, { onChange }, setThumbnailPreview)}
                            {...field}
                        />
                        </FormControl>
                        {thumbnailPreview && (
                            <Image src={thumbnailPreview} alt="Preview" className="h-20 w-20 object-cover rounded-md mt-2" />
                        )}
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="image"
                    render={({ field: { onChange, ...field } }) => (
                    <FormItem>
                        <FormLabel>Основное изображение</FormLabel>
                        <FormControl>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, { onChange }, setImagePreview)}
                            {...field}
                        />
                        </FormControl>
                        {imagePreview && (
                            <Image src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md mt-2" />
                        )}
                        <FormMessage />
                    </FormItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CourseContentType.SUBSCRIPTION}>Подписка</SelectItem>
                        <SelectItem value={CourseContentType.FIXED_COURSE}>Фиксированный курс</SelectItem>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите доступ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AccessType.paid}>Платный</SelectItem>
                        <SelectItem value={AccessType.free}>Бесплатный</SelectItem>
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
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner className="mr-2 h-4 w-4" />}
                Создать курс
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
