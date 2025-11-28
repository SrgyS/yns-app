/**
 * Generic image upload helper:
 * - opens a file picker (`selectFile`, default accept: image/*)
 * - optional size validation via `maxSizeMb`
 * - runs provided `mutationFn(file, input)` (e.g., builds FormData + calls server action)
 * - exposes `upload({ accept, maxSizeMb, input, onSuccess, onError })`
 *
 * `input` is forwarded to `mutationFn` along with the file when extra payload is needed
 * (e.g., tag "course-image"/"thumbnail", entity id, etc.). If not needed, omit it.
 */
import { useMutation } from '@tanstack/react-query'
import { selectFile, validateFileSize } from './file'

type UploadParams<T> = {
  accept?: string
  maxSizeMb?: number
  input?: T
  onSuccess?: (result: unknown, file: File) => void
  onError?: (reason?: 'big-size') => void
}

type MutationFn<T> = (file: File, input?: T) => Promise<unknown>

export function useUploadImage<T = void>({
  mutationFn,
}: {
  mutationFn: MutationFn<T>
}) {
  const mutation = useMutation({
    mutationFn: async ({ file, input }: { file: File; input?: T }) =>
      mutationFn(file, input),
  })

  const upload = async (options?: UploadParams<T>) => {
    const file = await selectFile(options?.accept ?? 'image/*')
    if (!file) return

    const maxSize = options?.maxSizeMb
    if (maxSize && !validateFileSize(file, maxSize)) {
      options?.onError?.('big-size')
      return
    }

    const result = await mutation.mutateAsync({
      file,
      input: options?.input,
    })

    options?.onSuccess?.(result, file)
  }

  return {
    upload,
    isPending: mutation.isPending,
    mutation,
  }
}
