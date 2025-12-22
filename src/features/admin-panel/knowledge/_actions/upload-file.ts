'use server'

import { z } from 'zod'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { BadRequest } from '@/shared/lib/errors'
import { redirect } from 'next/navigation'

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
])
const MAX_SIZE_MB = 20
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const resultSchema = z.object({
  path: z.string(),
  name: z.string(),
})

const sanitizeFileName = (name: string) =>
  name.replaceAll(/[^\w.-]+/g, '_').slice(-200)

export const uploadKnowledgeFileAction = async (formData: FormData) => {
  const file = formData.get('file')
  const tag = 'knowledge-file'

  if (!(file instanceof File)) {
    throw new BadRequest()
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new BadRequest(`Размер файла превышает ${MAX_SIZE_MB} МБ`)
  }

  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    throw new BadRequest('Недопустимый формат файла. Разрешены только PDF.')
  }

  const safeFile =
    sanitizeFileName(file.name) === file.name
      ? file
      : new File([file], sanitizeFileName(file.name), { type: file.type })

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const storedFile = await fileStorage.uploadFile(
    safeFile,
    tag,
    session.user.id
  )

  return resultSchema.parse({
    path: storedFile.path,
    name: storedFile.name,
  })
}
