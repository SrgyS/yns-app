import { useUploadImage } from '@/shared/lib/use-upload-image'
import { uploadCourseImageAction } from '../_actions/upload-course-image'
import { DEFAULT_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

type UploadTag = 'course-image' | 'course-thumbnail'
type UploadCourseImageResult = { path: string }

type UploadParams = {
  tag: UploadTag
  onSuccess?: (path: string, file: File) => void
  onError?: (reason?: 'big-size') => void
}

export function useUploadCourseImage() {
  const uploader = useUploadImage<UploadTag, UploadCourseImageResult>({
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
        onSuccess?.(result.path, file)
      },
    })

  return {
    isPending: uploader.isPending,
    upload: handleUpload,
  }
}
