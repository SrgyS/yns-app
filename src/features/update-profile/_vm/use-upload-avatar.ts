import { AVATAR_FILE_KEY, AVATAR_MAX_SIZE } from '../_constants'
import { uploadAvatarAction } from '../_actions/upload-avatar'
import { useUploadImage } from '@/shared/lib/use-upload-image'
import {
  ALLOWED_IMAGE_TYPES,
  AVATAR_IMAGE_MAX_SIZE_MB,
} from '@/shared/lib/upload-constants'

export const useUploadAvatar = ({
  onError,
  onSuccess,
}: {
  onError?: (type?: 'big-size') => void
  onSuccess?: (avatarPath: string | undefined, file: File) => void
}) => {
  const uploader = useUploadImage<void, { path: string }>({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.set(AVATAR_FILE_KEY, file)
      return uploadAvatarAction(formData)
    },
  })

  const handleFileSelect = () =>
    uploader.upload({
      accept: Array.from(ALLOWED_IMAGE_TYPES).join(','),
      maxSizeMb: AVATAR_IMAGE_MAX_SIZE_MB ?? AVATAR_MAX_SIZE,
      onError,
      onSuccess: (data, file) => {
        onSuccess?.(data.path, file)
      },
    })

  return {
    isPending: uploader.isPending,
    handleFileSelect,
  }
}
