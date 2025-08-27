import 'reflect-metadata'

import { CourseEntityModule } from '@/entity/course/module'
import { CoursesListModule } from '@/features/courses-list/module'
import { UpdateProfileModule } from '@/features/update-profile/server'
import { UserEntityModule } from '@/entity/user/module'
import { NextAuthModule } from '@/kernel/lib/next-auth/server'
import { Container } from 'inversify'
import { TrpcModule } from '@/kernel/lib/trpc/module'
import { CourseDetailsModule } from '@/features/course-details/server'
import { CourseEnrollmentControllerModule } from '@/features/course-enrollment/module'
import { DailyPlanModule } from '@/features/daily-plan/module'
import { WorkoutEntityModule } from '@/entity/workout/module'
import { PaymentEntityModule } from '@/entity/payment/module'

export function createServer() {
  const container = new Container()

  container.load(
    NextAuthModule,
    CoursesListModule,
    CourseEntityModule,
    UserEntityModule,
    UpdateProfileModule,
    TrpcModule,
    CourseDetailsModule,
    CourseEnrollmentControllerModule,
    DailyPlanModule,
    WorkoutEntityModule,
    PaymentEntityModule,
  )

  return container
}

export const server = createServer()