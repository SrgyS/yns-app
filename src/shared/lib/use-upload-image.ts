/**
 * Generic image upload helper:
 * - opens a file picker (`selectFile`, default accept: image/*)
 * - optional size validation via `maxSizeMb`
 * - runs provided `mutationFn(file, input)` (e.g., builds FormData + calls server action)
 * - exposes `upload({ accept, maxSizeMb, input, onSuccess, onError })`
 *
 * `input` is forwarded to `mutationFn` along with the file when extra payload is needed
 * (e.g., tag "course-image"/"thumbnail", entity id, etc.). If not needed, omit it.
 *
 * @typeParam T - тип дополнительного input-параметра, передаваемого в mutationFn
 * @typeParam R - тип результата, возвращаемого mutationFn (для типизированного onSuccess)
 */
import { useMutation } from '@tanstack/react-query'
import { selectFile, validateFileSize } from './file'

type UploadParams<T, R> = {
  accept?: string
  maxSizeMb?: number
  input?: T
  onSuccess?: (result: R, file: File) => void
  onError?: (reason?: 'big-size') => void
}

type MutationFn<T, R> = (file: File, input?: T) => Promise<R>

export function useUploadImage<T = void, R = unknown>({
  mutationFn,
}: {
  mutationFn: MutationFn<T, R>
}) {
  const mutation = useMutation({
    mutationFn: async ({ file, input }: { file: File; input?: T }) =>
      mutationFn(file, input),
  })

  const upload = async (options?: UploadParams<T, R>) => {
    const file = await selectFile(options?.accept ?? 'image/*')
    if (!file) return // пользователь отменил диалог

    const maxSize = options?.maxSizeMb
    if (maxSize && !validateFileSize(file, maxSize)) {
      options?.onError?.('big-size')
      return
    }

    try {
      const result = await mutation.mutateAsync({
        file,
        input: options?.input,
      })
      options?.onSuccess?.(result, file)
    } catch (err) {
      console.error('[useUploadImage] Upload failed:', err)
      options?.onError?.()
    }
  }

  return {
    upload,
    isPending: mutation.isPending,
  }
}
