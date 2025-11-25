import { CourseContentType, UserAccessReason } from '@prisma/client'
import { StaffPermissionFlags } from './staff-permission'

export type AdminUserProfile = {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  role: string
  createdAt: string
  lastActivityAt: string | null
  staffPermissions: StaffPermissionFlags
}

export type AdminUserAccess = {
  id: string
  courseId: string
  courseTitle: string
  contentType: CourseContentType
  reason: UserAccessReason
  adminName: string | null
  adminEmail: string | null
  closedByName: string | null
  closedAt: string | null
  createdAt: string
  startsAt: string | null
  expiresAt: string | null
  isActive: boolean
  freezes: { id: string; start: string; end: string; canceledAt: string | null }[]
}

export type AdminUserFreeze = {
  id: string
  start: string
  end: string
  createdAt: string
  createdBy: string | null
  canceledAt: string | null
  canceledBy: string | null
}

export type AdminUserPayment = {
  id: string
  createdAt: string
  amount: number
  state: string
  products: {
    id: string
    name: string
    price: number
    quantity: number
  }[]
}

export type AdminUserActivity = {
  date: string
  path: string | null
  menu: string | null
}

export type AdminUserDetail = {
  profile: AdminUserProfile
  accesses: AdminUserAccess[]
  freezes: AdminUserFreeze[]
  payments: AdminUserPayment[]
  activity: AdminUserActivity[]
}
