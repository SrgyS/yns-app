import 'reflect-metadata'

import { CourseEntityModule } from '@/entities/course/module'
import { CoursesListModule } from '@/features/courses-list/module'
import { UpdateProfileModule } from '@/features/update-profile/server'
import { UserEntityModule } from '@/entities/user/module'
import { NextAuthModule } from '@/kernel/lib/next-auth/module'
import { Container } from 'inversify'
import { TrpcModule } from '@/kernel/lib/trpc/module'
import { CourseDetailsModule } from '@/features/course-details/module'
import { CourseEnrollmentControllerModule } from '@/features/course-enrollment/module'
import { DailyPlanModule } from '@/features/daily-plan/module'
import { WorkoutEntityModule } from '@/entities/workout/module'
import { PaymentEntityModule } from '@/entities/payment/module'
import { CourseOrderModule } from '@/features/course-order/module'
import { UserAccessModule } from '@/entities/user-access/module'
import { UserCoursesModule } from '@/features/user-courses/module'
import { AdminUsersModule } from '@/features/admin-panel/users/module'
import { AdminCoursesModule } from '@/features/admin-panel/courses/module'
import { AdminWorkoutsModule } from '@/features/admin-panel/workouts/module'
import { KnowledgeModule } from '@/entities/knowledge/module'
import { AdminKnowledgeModule } from '@/features/admin-panel/knowledge/module'


export function createServer() {
  const container = new Container()

  container.load(
    CourseEntityModule,
    NextAuthModule,
    CoursesListModule,
    UserEntityModule,
    UpdateProfileModule,
    TrpcModule,
    CourseDetailsModule,
    CourseEnrollmentControllerModule,
    DailyPlanModule,
    WorkoutEntityModule,
    PaymentEntityModule,
    CourseOrderModule,
    UserAccessModule,
    UserCoursesModule,
    AdminUsersModule,
    AdminCoursesModule,
    AdminWorkoutsModule,
    AdminKnowledgeModule,
    KnowledgeModule
  )

  return container
}

export const server = createServer()
