'use server'

import { z } from 'zod'
import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { BadRequest } from '@/shared/lib/errors'
import { redirect } from 'next/navigation'

const allowedTags = ['course-image', 'course-thumbnail'] as const
const tagSchema = z
  .enum(allowedTags)
  .catch('course-image')

const resultSchema = z.object({
  path: z.string(),
})

export const uploadCourseImageAction = async (formData: FormData) => {
  const file = formData.get('file')
  const tag = tagSchema.parse(formData.get('tag'))

  if (!(file instanceof File)) {
    throw new BadRequest()
  }

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const storedFile = await fileStorage.uploadImage(file, tag, session.user.id)

  return resultSchema.parse({
    path: storedFile.path,
  })
}
