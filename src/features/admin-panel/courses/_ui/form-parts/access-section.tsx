import {
  Control,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import { AccessType, CourseContentType } from '@prisma/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { CourseFormValues } from '../model/schema'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'

interface AccessSectionProps {
  control: Control<CourseFormValues>
  disabled?: boolean
  initialContentType?: CourseContentType
}

export function AccessSection({
  control,
  disabled,
  initialContentType,
}: Readonly<AccessSectionProps>) {
  const contentTypeWatch = useWatch({
    control,
    name: 'contentType',
    defaultValue: initialContentType ?? CourseContentType.FIXED_COURSE,
  })
  const { register } = useFormContext<CourseFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tariffs',
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          control={control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип курса</FormLabel>
              <Select
                onValueChange={(value: string) =>
                  field.onChange(value as CourseContentType)
                }
                value={
                  contentTypeWatch ??
                  initialContentType ??
                  CourseContentType.FIXED_COURSE
                }
                disabled={disabled}
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
          control={control}
          name="durationWeeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Длительность (недель)</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <FormLabel>Тарифы</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              append({
                access: AccessType.paid,
                price: 1,
                durationDays: 1,
                feedback: false,
              })
            }
          >
            Добавить тариф
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            return (
              <div
                key={field.id}
                className="rounded-xl border bg-muted/30 p-4 space-y-4"
              >
                <input
                  type="hidden"
                  value={AccessType.paid}
                  {...register(`tariffs.${index}.access`)}
                />

                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium">Платный тариф</div>
                  <div className="flex items-center gap-3">
                    <FormField
                      control={control}
                      name={`tariffs.${index}.feedback`}
                      render={({ field: feedbackField }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={Boolean(feedbackField.value)}
                              onCheckedChange={checked =>
                                feedbackField.onChange(Boolean(checked))
                              }
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            С обратной связью
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={control}
                    name={`tariffs.${index}.price`}
                    render={({ field: priceField }) => (
                      <FormItem>
                        <FormLabel>Цена (₽)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            {...priceField}
                            value={priceField.value ?? ''}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`tariffs.${index}.durationDays`}
                    render={({ field: durationField }) => (
                      <FormItem>
                        <FormLabel>Длительность доступа (дни)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            step="1"
                            {...durationField}
                            value={durationField.value ?? ''}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
