"use client"

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

import { adminUsersApi } from '../_api'
import { AvatarFilter } from '../_domain/types'

const DEFAULT_PAGE_SIZE = 20

function parsePage(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed
}

function parseAvatarFilter(value: string | null): AvatarFilter {
  if (value === 'with' || value === 'without') {
    return value
  }
  return 'any'
}

export function useAdminUsers() {
  const searchParams = useSearchParams()

  const filters = useMemo(() => {
    const id = searchParams.get('id') ?? undefined
    const email = searchParams.get('email') ?? undefined
    const phone = searchParams.get('phone') ?? undefined
    const roleParam = searchParams.get('role')
    const role =
      roleParam === 'ADMIN' || roleParam === 'USER' || roleParam === 'STAFF'
        ? roleParam
        : undefined
    const hasAvatar = parseAvatarFilter(searchParams.get('hasAvatar'))
    const page = parsePage(searchParams.get('page'), 1)
    const pageSize = parsePage(
      searchParams.get('pageSize'),
      DEFAULT_PAGE_SIZE
    )

    return {
      id,
      email,
      phone,
      role,
      hasAvatar,
      page,
      pageSize,
    }
  }, [searchParams])

  const query = adminUsersApi.admin.user.list.useQuery(filters, {
    keepPreviousData: true,
    staleTime: 30 * 1000,
  })

  return {
    ...query,
    filters,
  }
}
