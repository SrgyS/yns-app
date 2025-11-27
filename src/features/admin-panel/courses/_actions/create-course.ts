'use server'

import { z } from 'zod'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CourseContentType, AccessType, ROLE } from '@prisma/client'
import { server } from '@/app/server'
import { CreateCourseService } from '@/entities/course/module'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { createAdminAbility } from '../../users/_domain/ability'
import { StaffPermissionService } from '../../users/_services/staff-permissions'

const createCourseSchema = z.object({
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  shortDescription: z.string().optional(),
  thumbnail: z.string().optional(),
  image: z.string().optional(),
  contentType: z.nativeEnum(CourseContentType),
  access: z.nativeEnum(AccessType),
  price: z.coerce.number().optional(),
  durationWeeks: z.coerce.number(),
})

export const createCourseAction = async (data: z.infer<typeof createCourseSchema>) => {
  const input = createCourseSchema.parse(data)

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  const staffPermissionService = server.get(StaffPermissionService)
  const permissions = await staffPermissionService.getPermissionsForUser({
    id: session.user.id,
    role: session.user.role as ROLE,
  })

  const ability = createAdminAbility(session, permissions)
  const service = server.get(CreateCourseService)

  await service.exec(input, ability)

  revalidatePath('/admin/courses')
}
