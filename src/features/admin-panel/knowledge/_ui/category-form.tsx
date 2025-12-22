'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { adminKnowledgeApi } from '../_api'
import { toast } from 'sonner'

const categorySchema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  slug: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
  order: z.number().optional(),
})

type CategoryFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId?: string
  category?: any
  linked?: boolean
  onSuccess: () => void
}

export function CategoryForm({
  open,
  onOpenChange,
  courseId,
  category,
  linked,
  onSuccess,
}: CategoryFormProps) {
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      order: 0,
    },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        title: category.title,
        slug: category.slug,
        description: category.description || '',
        order: category.order ?? 0,
      })
    } else {
      form.reset({
        title: '',
        slug: '',
        description: '',
        order: 0,
      })
    }
  }, [category, form, open])

  const createMutation = adminKnowledgeApi.adminKnowledge.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Категория создана')
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = adminKnowledgeApi.adminKnowledge.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Категория обновлена')
      onSuccess()
    },
    onError: (err) => toast.error(err.message),
  })

  const onSubmit = (values: z.infer<typeof categorySchema>) => {
    const payload = linked ? values : { ...values, order: undefined }
    if (category) {
      updateMutation.mutate({
        id: category.id,
        ...(linked && courseId ? { courseId } : {}),
        ...payload,
      })
    } else {
      createMutation.mutate({
        courseId,
        ...payload,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Редактировать тему' : 'Новая тема'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="system-pitaniya" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {linked ? (
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Порядок сортировки</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
