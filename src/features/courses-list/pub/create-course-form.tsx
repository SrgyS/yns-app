'use client'

import { Form } from '@/shared/ui/form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTransition } from 'react'
import { createCourseAction } from '../actions'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/ui/utils'

const createCourseFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
})

export function CreateCourseForm({
  className,
  revalidatePagePath,
}: {
  className: string
  revalidatePagePath: string
}) {
  const [isCreateTransition, startCreateTransition] = useTransition()
  const form = useForm({
    resolver: zodResolver(createCourseFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => {
          startCreateTransition(async () => {
            await createCourseAction(data, revalidatePagePath)
          })
        })}
        className={cn('space-y-4', className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название курса</FormLabel>
              <FormControl>
                <Input placeholder="название..." {...field} />
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
              <FormLabel>Описание курса</FormLabel>
              <FormControl>
                <Textarea placeholder="описание..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isCreateTransition}>
          Добавить
        </Button>
      </form>
    </Form>
  )
}
