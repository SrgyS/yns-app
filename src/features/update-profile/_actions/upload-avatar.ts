'use server'
import { server } from '@/app/'
import { z } from 'zod'
import { AVATAR_FILE_KEY } from '../_constants'
import { BadRequest } from '@/shared/lib/errors'

import { redirect } from 'next/navigation'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'
import { SessionService } from '@/kernel/lib/next-auth/server'

const resultSchema = z.object({
  avatar: z.object({
    path: z.string(),
  }),
})

export const uploadAvatarAction = async (formData: FormData) => {
  const file = formData.get(AVATAR_FILE_KEY)

  if (!(file instanceof File)) {
    throw new BadRequest()
  }
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const userId = session.user.id

  const storedFile = await fileStorage.uploadImage(file, 'avatar', userId)

  return resultSchema.parse({
    avatar: storedFile,
  })
}

