import { Control, useWatch } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { AccessType, CourseContentType } from '@prisma/client'
import { CourseFormValues } from '../model/schema'

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
  const access = useWatch({ control, name: 'access' })
  const contentTypeWatch = useWatch({
    control,
    name: 'contentType',
    defaultValue: initialContentType ?? CourseContentType.FIXED_COURSE,
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <FormField
          control={control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип курса</FormLabel>
              <Select
                onValueChange={value =>
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

        <FormField
          control={control}
          name="access"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Доступ</FormLabel>
              <Select
                onValueChange={value => field.onChange(value as AccessType)}
                value={field.value}
                disabled={disabled}
              >
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
        <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
          <FormField
            control={control}
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  )
}
