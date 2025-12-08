import { useEffect } from 'react'
import {
  Control,
  useFieldArray,
  useWatch,
  useFormContext,
} from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { CourseContentType } from '@prisma/client'
import { CourseFormValues } from '../model/schema'
import { FormControl, FormItem, FormField } from '@/shared/ui/form'

interface WeeksManagerProps {
  control: Control<CourseFormValues>
  disabled?: boolean
}

export function WeeksManager({
  control,
  disabled,
}: Readonly<WeeksManagerProps>) {
  const { setValue } = useFormContext<CourseFormValues>()
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'weeks',
  })

  const contentType = useWatch({ control, name: 'contentType' })
  const durationWeeks = useWatch({ control, name: 'durationWeeks' })
  const isSubscription = contentType === CourseContentType.SUBSCRIPTION

  useEffect(() => {
    if (durationWeeks < 1) return

    // If existing weeks are fewer than duration, populate them
    // This runs primarily when switching from Fixed -> Subscription or increasing duration
    if (fields.length < durationWeeks) {
      const weeksToAdd = durationWeeks - fields.length
      const lastWeek = fields.at(-1)
      const startWeekNum = lastWeek ? lastWeek.weekNumber + 1 : 1

      const newItems = Array.from({ length: weeksToAdd }).map((_, idx) => ({
        weekNumber: startWeekNum + idx,
        releaseAt: new Date().toISOString(),
      }))
      append(newItems)
    } else if (fields.length > durationWeeks) {
      const newWeeks = fields.slice(0, durationWeeks)
      replace(newWeeks)
    }
  }, [durationWeeks, append, replace, fields.length])

  if (!isSubscription) return null

  return (
    <div className="col-span-full space-y-3 rounded-xl border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">Доступ к неделям (release date)</h3>
      <p className="text-xs text-muted-foreground">
        Укажите дату, с которой неделя станет доступна пользователям. Для пустых
        значений используется сегодняшняя дата.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const nextNumber = fields.length + 1
            append({
              weekNumber: nextNumber,
              releaseAt: new Date().toISOString(),
            })
            setValue('durationWeeks', nextNumber, { shouldValidate: true })
          }}
          disabled={disabled}
        >
          Добавить неделю
        </Button>
        {fields.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Всего недель: {fields.length}
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field, index) => {
          return (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-lg border bg-background p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Неделя {field.weekNumber}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled || fields.length <= 1}
                  onClick={() => {
                    remove(index)
                    const nextLength = Math.max(fields.length - 1, 1)
                    setValue('durationWeeks', nextLength, {
                      shouldValidate: true,
                    })
                  }}
                  title="Удалить неделю"
                >
                  ×
                </Button>
              </div>

              <FormField
                control={control}
                name={`weeks.${index}.releaseAt`}
                render={({ field: inputField }) => {
                  const dateValue = inputField.value
                    ? new Date(inputField.value).toISOString().slice(0, 10)
                    : ''
                  return (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="date"
                          value={dateValue}
                          onChange={e => {
                            const nextDate = e.target.value
                              ? new Date(e.target.value).toISOString()
                              : new Date().toISOString()
                            inputField.onChange(nextDate)
                          }}
                          disabled={disabled}
                        />
                      </FormControl>
                    </FormItem>
                  )
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
