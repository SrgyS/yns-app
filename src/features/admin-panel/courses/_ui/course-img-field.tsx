import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/shared/ui/button'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { toast } from 'sonner'

import { useUploadCourseImage } from '../_vm/use-upload-course-image'
import { OptimizedImage } from '@/shared/ui/optimized-image'

type Props = {
  label: string
  value?: string | null
  onChange: (path: string | null) => void
  tag: 'course-image' | 'course-thumbnail'
  disabled?: boolean
}

export function CourseImgField({
  label,
  value,
  onChange,
  tag,
  disabled,
}: Readonly<Props>) {
  const upload = useUploadCourseImage()
  const isPending = upload.isPending || disabled
  const [preview, setPreview] = useState<string | null>(value ?? null)

  useEffect(() => {
    setPreview(value ?? null)
  }, [value])

  const handleUpload = async () => {
    await upload.upload({
      tag,
      onSuccess: (path, file) => {
        onChange(path)
        const url = URL.createObjectURL(file)
        setPreview(url)
      },
      onError: reason => {
        if (reason === 'big-size') {
          toast.error('Файл слишком большой (макс 10 МБ)')
        }
      },
    })
  }

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleUpload}
        >
          {upload.isPending && 'Загрузка...'}
          {value ? 'Заменить' : 'Загрузить'}
        </Button>
      </FormControl>
      {preview ? (
        preview.startsWith('blob:') || preview.startsWith('data:') ? (
          <Image
            src={preview}
            alt="Preview"
            width={100}
            height={100}
            unoptimized
            className="h-20 w-20 object-cover rounded-md mt-2"
          />
        ) : (
          <OptimizedImage
            src={preview}
            alt="Preview"
            width={100}
            height={100}
            className="h-20 w-20 object-cover rounded-md mt-2"
          />
        )
      ) : null}
      <FormMessage />
    </FormItem>
  )
}
