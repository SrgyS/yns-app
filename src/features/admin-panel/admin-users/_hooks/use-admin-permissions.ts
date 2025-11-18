"use client"

import { adminUsersApi } from '../_api'

export function useAdminPermissions() {
  return adminUsersApi.admin.user.permissions.useQuery(undefined, {
    staleTime: 30 * 1000,
  })
}
