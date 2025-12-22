import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'

import { useUploadAvatar } from '../_vm/use-upload-avatar'
import { ProfileAvatar } from '@/entities/user/client'

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
  const { handleFileSelect, isPending } = useUploadAvatar({
    onSuccess: onChange,
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
      <ProfileAvatar
        className="w-full h-full"
        profile={{ email, image: value, name }}
      />
    </Button>
  )
}
