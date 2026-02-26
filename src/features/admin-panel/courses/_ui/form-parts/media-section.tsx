import { Control } from 'react-hook-form'
import { FormField } from '@/shared/ui/form'
import { CourseImgField } from '../course-img-field'
import { CourseFormValues } from '../model/schema'

interface MediaSectionProps {
  control: Control<CourseFormValues>
  disabled?: boolean
}

export function MediaSection({ control, disabled }: MediaSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormField
        control={control}
        name="thumbnail"
        render={({ field }) => (
          <CourseImgField
            label="Миниатюра (Thumbnail)"
            tag="site/course-thumbnail"
            value={field.value ?? null}
            initialValue={field.value ?? null} // Changed from loading initial helper, assume control has data
            onChange={(path) => field.onChange(path)}
            disabled={disabled}
          />
        )}
      />

      <FormField
        control={control}
        name="image"
        render={({ field }) => (
          <CourseImgField
            label="Основное изображение"
            tag="site/course-image"
            value={field.value ?? null}
            initialValue={field.value ?? null}
            onChange={(path) => field.onChange(path)}
            disabled={disabled}
          />
        )}
      />
    </div>
  )
}
