import { Control } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { CourseFormValues } from '../model/schema'

interface GeneralInfoSectionProps {
  control: Control<CourseFormValues>
  disabled?: boolean
}

export function GeneralInfoSection({ control, disabled }: GeneralInfoSectionProps) {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название курса</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 text-base"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription className="min-h-10">
                Заголовок, который увидят пользователи в карточках и на странице
                курса.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL адрес)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="h-11 text-base"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription className="min-h-10">
                Уникальный идентификатор курса в URL. Только латиница, цифры и
                дефис.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Полное описание</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Подробное описание курса..."
                className="min-h-30"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="shortDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Краткое описание</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Краткое описание для карточки..."
                className="min-h-30"
                {...field}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
