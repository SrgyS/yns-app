'use client'

import { adminUsersApi } from '../_api'

export function useAdminUserDetail(userId: string) {
  return adminUsersApi.admin.user.detail.useQuery(
    { userId },
    {
      staleTime: 30 * 1000,
    }
  )
}
