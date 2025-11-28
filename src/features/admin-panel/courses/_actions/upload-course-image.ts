'use server'

import { z } from 'zod'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { BadRequest } from '@/shared/lib/errors'
import { redirect } from 'next/navigation'
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_IMAGE_MAX_SIZE_MB,
} from '@/shared/lib/upload-constants'

const allowedTags = ['course-image', 'course-thumbnail'] as const
const tagSchema = z.enum(allowedTags)

const resultSchema = z.object({
  path: z.string(),
})

const MAX_SIZE_MB = DEFAULT_IMAGE_MAX_SIZE_MB
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

const sanitizeFileName = (name: string) =>
  name.replaceAll(/[^\w.-]+/g, '_').slice(-200)

export const uploadCourseImageAction = async (formData: FormData) => {
  const file = formData.get('file')
  const parsedTag = tagSchema.safeParse(formData.get('tag'))
  const tag = parsedTag.success ? parsedTag.data : 'course-image'

  if (!(file instanceof File)) {
    throw new BadRequest()
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new BadRequest(`Размер файла превышает ${MAX_SIZE_MB} МБ`)
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

  const storedFile = await fileStorage.uploadImage(
    safeFile,
    tag,
    session.user.id
  )

  return resultSchema.parse({
    path: storedFile.path,
  })
}
