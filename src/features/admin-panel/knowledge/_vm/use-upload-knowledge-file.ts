import { useTransition } from 'react'
import { uploadKnowledgeFileAction } from '../_actions/upload-file'



export function useUploadKnowledgeFile() {
  const [isPending, startTransition] = useTransition()

  const upload = ({
    file,
    onSuccess,
    onError,
  }: {
    file: File
    onSuccess?: (result: { path: string; name: string }) => void
    onError?: (error: unknown) => void
  }) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const result = await uploadKnowledgeFileAction(formData)
        onSuccess?.(result)
      } catch (error) {
        console.error(error)
        onError?.(error)
      }
    })
  }

  return {
    upload,
    isPending,
  }
}
