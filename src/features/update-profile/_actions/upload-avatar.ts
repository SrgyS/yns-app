'use server'

import { server } from '@/app/server'
import { z } from 'zod'
import { AVATAR_FILE_KEY, AVATAR_MAX_SIZE } from '../_constants'
import { BadRequest } from '@/shared/lib/errors'

import { redirect } from 'next/navigation'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { ALLOWED_IMAGE_TYPES, AVATAR_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

const resultSchema = z.object({
  path: z.string(),
})

const MAX_SIZE_BYTES = AVATAR_IMAGE_MAX_SIZE_MB * 1024 * 1024

const sanitizeFileName = (name: string) =>
  name.replace(/[^\w.-]+/g, '_').slice(-200)

export const uploadAvatarAction = async (formData: FormData) => {
  const file = formData.get(AVATAR_FILE_KEY)

  if (!(file instanceof File)) {
    throw new BadRequest()
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new BadRequest(`Размер файла превышает ${AVATAR_IMAGE_MAX_SIZE_MB} МБ`)
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new BadRequest('Недопустимый формат изображения')
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

  const userId = session.user.id

  const storedFile = await fileStorage.uploadImage(safeFile, 'avatar', userId)

  return resultSchema.parse({
    path: storedFile.path,
  })
}
