import { Control, useWatch } from 'react-hook-form'
import { Checkbox } from '@/shared/ui/checkbox'
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { CourseContentType } from '@prisma/client'
import { CourseFormValues } from '../model/schema'

interface ScheduleSectionProps {
  control: Control<CourseFormValues>
  disabled?: boolean
}

export function ScheduleSection({ control, disabled }: ScheduleSectionProps) {
  const contentType = useWatch({ control, name: 'contentType' })
  const isSubscription = contentType === CourseContentType.SUBSCRIPTION

  return (
    <FormField
      control={control}
      name="allowedWorkoutDaysPerWeek"
      render={({ field }) => {
        const toggleAllowedDay = (day: number) => {
          const current = field.value
          if (isSubscription) {
            field.onChange([day])
            return
          }
          if (current.includes(day)) {
            field.onChange(current.filter((value) => value !== day))
            return
          }
          field.onChange([...current, day].sort((a, b) => a - b))
        }

        return (
          <FormItem>
            <FormLabel>Число тренировок в неделю</FormLabel>
            <FormDescription className="min-h-10">
              {isSubscription
                ? 'Для подписки выбирается одно фиксированное число тренировочных дней. Пользователь выберет конкретные дни недели позже.'
                : 'Выберите варианты (например, 3, 4, 5). Максимум из выбранных значений будет использоваться как требование по количеству основных тренировок.'}
            </FormDescription>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 7 }).map((_, idx) => {
                const dayValue = idx + 1
                const checked = field.value?.includes(dayValue)

                return (
                  <label
                    key={dayValue}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleAllowedDay(dayValue)}
                      disabled={disabled}
                    />
                    <span>{dayValue} дн/нед</span>
                  </label>
                )
              })}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
