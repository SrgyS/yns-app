import { CourseContentType, UserAccessReason } from '@prisma/client'

export type AdminUserProfile = {
  id: string
  name: string | null
  email: string
  phone: string | null
  image: string | null
  role: string
  createdAt: string
  lastActivityAt: string | null
  staffPermissions: {
    canViewPayments: boolean
    canEditAccess: boolean
    canManageUsers: boolean
    canGrantAccess: boolean
    canLoginAsUser: boolean
  }
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

export type AdminUserDetail = {
  profile: AdminUserProfile
  accesses: AdminUserAccess[]
  payments: AdminUserPayment[]
}
