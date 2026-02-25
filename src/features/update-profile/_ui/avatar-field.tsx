import { useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { toast } from 'sonner'

import { useUploadAvatar } from '../_vm/use-upload-avatar'
import { ProfileAvatar } from '@/entities/user/client'
import { AVATAR_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

export function AvatarField({
  value,
  onChange,
  name,
  email,
  disabled,
}: {
  value?: string
  onChange: (value?: string) => void
  name?: string
  email: string
  disabled?: boolean
}) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const { handleFileSelect, isPending } = useUploadAvatar({
    onSuccess: (path, file) => {
      if (typeof path === 'string') {
        // Обновляем значение формы (storage path) для сохранения
        onChange(path)
      }

      // Отображаем blob URL мгновенно, не дожидаясь ре-рендера с CDN URL
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
    },
    onError: type => {
      if (type === 'big-size') {
        toast.error(`Файл слишком большой (макс ${AVATAR_IMAGE_MAX_SIZE_MB} МБ)`)
      } else {
        toast.error('Не удалось загрузить аватар')
      }
    },
  })

  const isDisabled = Boolean(disabled || isPending)

  return (
    <Button
      variant="ghost"
      className="w-[84px] h-[84px] p-0.5 rounded-full relative block"
      type="button"
      onClick={handleFileSelect}
      disabled={isDisabled}
      aria-disabled={isDisabled}
    >
      {isPending && (
        <div className="inset-0 absolute flex items-center justify-center z-10">
          <Spinner className="w-10 h-10" aria-label="Загрузка новой аватарки" />
        </div>
      )}
      {localPreview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={localPreview}
          alt="Новый аватар"
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <ProfileAvatar
          className="w-full h-full"
          profile={{ email, image: value, name }}
        />
      )}
    </Button>
  )
}
