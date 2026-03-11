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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { SUBSCRIPTION_TARIFF_SLOT_COUNT } from '../model/subscription-tariffs'

interface AccessSectionProps {
  control: Control<CourseFormValues>
  disabled?: boolean
  initialContentType?: CourseContentType
}

const SUBSCRIPTION_GROUPS = [
  {
    key: 'withoutFeedback' as const,
    title: 'Без обратной связи',
    description: 'Доступ к материалам курса без сопровождения куратора.',
  },
  {
    key: 'withFeedback' as const,
    title: 'С обратной связью',
    description: 'Доступ к материалам курса с сопровождением и комментариями.',
  },
]

function formatDurationHint(durationDays: number | undefined) {
  if (!durationDays || durationDays <= 0) {
    return null
  }

  if (durationDays % 30 === 0) {
    const months = durationDays / 30
    return `Примерно ${months} мес.`
  }

  return null
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
  const isSubscription = contentTypeWatch === CourseContentType.SUBSCRIPTION

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

      {isSubscription ? (
        <div className="space-y-3">
          <FormLabel>Тарифы</FormLabel>
          <div className="grid gap-4 xl:grid-cols-2">
            {SUBSCRIPTION_GROUPS.map(group => (
              <Card key={group.key} className="rounded-xl border bg-muted/30">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({
                    length: SUBSCRIPTION_TARIFF_SLOT_COUNT,
                  }).map((_, index) => {
                    return (
                      <div
                        key={`${group.key}-${index + 1}`}
                        className="grid gap-4 rounded-lg border bg-background p-4"
                      >
                        <div className="text-sm font-medium">
                          Вариант {index + 1}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={control}
                            name={`subscriptionTariffs.${group.key}.${index}.price`}
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
                                    disabled={disabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name={`subscriptionTariffs.${group.key}.${index}.durationDays`}
                            render={({ field }) => {
                              const durationHint = formatDurationHint(
                                Number(field.value)
                              )

                              return (
                                <FormItem>
                                  <FormLabel>Длительность доступа (дни)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      step="1"
                                      {...field}
                                      value={field.value ?? ''}
                                      disabled={disabled}
                                    />
                                  </FormControl>
                                  {durationHint ? (
                                    <div className="text-xs text-muted-foreground">
                                      {durationHint}
                                    </div>
                                  ) : null}
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
