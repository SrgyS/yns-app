import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { toast } from 'sonner'

import { useUploadCourseImage } from '../_vm/use-upload-course-image'
import { OptimizedImage } from '@/shared/ui/optimized-image'

type Props = {
  label: string
  value?: string | null
  onChange: (path: string | null) => void
  tag: 'course-image' | 'course-thumbnail'
  disabled?: boolean
  aspect?: string
}

export function CourseImgField({
  label,
  value,
  onChange,
  tag,
  disabled,
  aspect = '4 / 3',
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
      <div
        className="mt-3 w-full max-w-xl overflow-hidden rounded-md border border-dashed bg-muted/50 cursor-pointer transition hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ aspectRatio: aspect }}
        onClick={handleUpload}
        role="button"
        tabIndex={0}
      >
        {preview ? (
          <div className="relative h-full w-full">
            {preview.startsWith('blob:') || preview.startsWith('data:') ? (
              <Image
                src={preview}
                alt="Preview"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <OptimizedImage
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
              />
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-6 w-6" />
            {isPending ? 'Загрузка...' : 'Добавить изображение'}
          </div>
        )}
      </div>
      <FormMessage />
    </FormItem>
  )
}
