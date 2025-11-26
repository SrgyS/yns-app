'use client'

import { adminUsersApi } from '../_api'

export function useAdminAbility() {
  return adminUsersApi.admin.user.permissions.useQuery(undefined, {
    staleTime: 30 * 1000,
  })
}
