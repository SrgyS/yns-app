import { ROLE } from '@prisma/client'

export type AvatarFilter = 'any' | 'with' | 'without'

export type AdminUserListFilters = {
  id?: string
  email?: string
  phone?: string
  role?: ROLE
  hasAvatar: AvatarFilter
  hasActiveAccess: 'active' | 'inactive' | 'any'
  sortBy: 'createdAt' | 'name'
  sortDir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export type AdminUserListItem = {
  id: string
  email: string
  name: string | null
  image: string | null
  phone: string | null
  role: ROLE
  hasActiveAccess: boolean
}

export type AdminUserListResult = {
  items: AdminUserListItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}
