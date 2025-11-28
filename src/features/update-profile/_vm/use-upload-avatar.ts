import { AVATAR_FILE_KEY, AVATAR_MAX_SIZE } from '../_constants'
import { uploadAvatarAction } from '../_actions/upload-avatar'
import { useUploadImage } from '@/shared/lib/use-upload-image'
import { AVATAR_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

export const useUploadAvatar = ({
  onError,
  onSuccess,
}: {
  onError?: (type?: 'big-size') => void
  onSuccess?: (avatarPath: string) => void
}) => {
  const uploader = useUploadImage<FormData>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.set(AVATAR_FILE_KEY, file)
      return uploadAvatarAction(formData)
    },
  })

  const handleFileSelect = () =>
    uploader.upload({
      maxSizeMb: AVATAR_IMAGE_MAX_SIZE_MB ?? AVATAR_MAX_SIZE,
      onError,
      onSuccess: data => {
        const path = (data as any)?.path
        if (typeof path === 'string') {
          onSuccess?.(path)
        }
      },
    })

  return {
    isPending: uploader.isPending,
    handleFileSelect,
  }
}
