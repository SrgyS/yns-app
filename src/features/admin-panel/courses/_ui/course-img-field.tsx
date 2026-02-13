import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { FormItem, FormLabel, FormMessage } from '@/shared/ui/form'
import { toast } from 'sonner'

import { useUploadCourseImage } from '../_vm/use-upload-course-image'
import { AppImage } from '@/shared/ui/app-image'
import { Button } from '@/shared/ui/button'

type Props = {
  label: string
  value?: string | null
  initialValue?: string | null
  onChange: (path: string | null) => void
  tag: 'course-image' | 'course-thumbnail'
  disabled?: boolean
  aspect?: string
}

export function CourseImgField({
  label,
  value,
  initialValue,
  onChange,
  tag,
  disabled,
  aspect = '4 / 3',
}: Readonly<Props>) {
  const upload = useUploadCourseImage()
  const isPending = upload.isPending || disabled
  const [preview, setPreview] = useState<string | null>(value ?? null)
  const [baseValue, setBaseValue] = useState<string | null>(
    initialValue ?? null
  )

  const isLocalPreview =
    preview && (preview.startsWith('blob:') || preview.startsWith('data:'))

  useEffect(() => {
    setPreview(value ?? null)
  }, [value])

  useEffect(() => {
    setBaseValue(initialValue ?? null)
  }, [initialValue])

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

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
  }

  const handleReset = () => {
    setPreview(baseValue)
    onChange(baseValue)
  }

  const canReset = Boolean(baseValue) && preview !== baseValue
  const hasPreview = Boolean(preview)

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Button
        asChild
        variant="ghost"
        className="w-full h-auto mt-3"
        style={{ aspectRatio: aspect }}
        onClick={handleUpload}
      >
        <div className="w-full max-w-xl overflow-hidden rounded-md border border-dashed bg-muted/50 cursor-pointer transition hover:border-primary/70 focus:outline-none focus:ring-2 focus:ring-primary">
          {preview ? (
            <div className="relative h-full w-full">
              {isLocalPreview ? (
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <AppImage
                  src={preview ?? ''}
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
      </Button>
      <div className="mt-2 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreview || isPending}
          onClick={handleRemove}
        >
          Удалить
        </Button>
        {canReset ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleReset}
          >
            Отменить
          </Button>
        ) : null}
      </div>
      <FormMessage />
    </FormItem>
  )
}
