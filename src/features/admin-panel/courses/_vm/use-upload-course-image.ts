import { useUploadImage } from '@/shared/lib/use-upload-image'
import { uploadCourseImageAction } from '../_actions/upload-course-image'
import { DEFAULT_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

type UploadParams = {
  tag: 'course-image' | 'course-thumbnail'
  onSuccess?: (path: string, file: File) => void
  onError?: (reason?: 'big-size') => void
}

export function useUploadCourseImage() {
  const uploader = useUploadImage<UploadParams['tag']>({
    mutationFn: async (file, tag) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tag', tag ?? 'course-image')
      return uploadCourseImageAction(formData)
    },
  })

  const handleUpload = ({ tag, onSuccess, onError }: UploadParams) =>
    uploader.upload({
      input: tag,
      maxSizeMb: DEFAULT_IMAGE_MAX_SIZE_MB,
      onError,
      onSuccess: (result, file) => {
        const path = (result as any)?.path
        if (typeof path === 'string') {
          onSuccess?.(path, file)
        }
      },
    })

  return {
    isPending: uploader.isPending,
    upload: handleUpload,
  }
}
