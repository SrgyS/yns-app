"use client"

import { useCallback, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { adminUsersApi } from '../_api'
import { AvatarFilter } from '../_domain/types'
import { ROLE } from '@prisma/client'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT_BY = 'createdAt'
const DEFAULT_SORT_DIR: 'asc' | 'desc' = 'desc'

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

export type AdminUsersFilterKey =
  | 'id'
  | 'email'
  | 'phone'
  | 'role'
  | 'hasAvatar'
  | 'hasActiveAccess'
  | 'pageSize'
  | 'page'

export function useAdminUsers() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const serializeParams = useCallback(() => new URLSearchParams(searchParams.toString()), [searchParams])
  const [isPending, startTransition] = useTransition()

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = serializeParams()
      updater(params)
      const query = params.toString()
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        })
      })
    },
    [pathname, router, serializeParams]
  )

  const setFilter = useCallback(
    (
      key: AdminUsersFilterKey,
      value: string,
      options?: { resetPage?: boolean }
    ) => {
      const resetPage = options?.resetPage ?? true
      updateParams(params => {
        const normalized = value.trim()
        const shouldDelete =
          normalized === '' ||
          (key === 'hasAvatar' && normalized === 'any') ||
          (key === 'hasActiveAccess' && normalized === 'any') ||
          (key === 'role' && normalized === 'all') ||
          (key === 'pageSize' && Number(normalized) === DEFAULT_PAGE_SIZE) ||
          (key === 'page' && Number(normalized) <= 1)

        if (shouldDelete) {
          params.delete(key)
        } else {
          params.set(key, normalized)
        }

        if (resetPage) {
          params.delete('page')
        }
      })
    },
    [updateParams]
  )

  const setSorting = useCallback(
    (sortBy: 'createdAt' | 'name', sortDir: 'asc' | 'desc') => {
      updateParams(params => {
        params.set('sortBy', sortBy)
        params.set('sortDir', sortDir)
        params.delete('page')
      })
    },
    [updateParams]
  )

  const filters = useMemo(() => {
    const id = searchParams.get('id') ?? undefined
    const email = searchParams.get('email') ?? undefined
    const phone = searchParams.get('phone') ?? undefined
    const roleParam = searchParams.get('role')
    const role: ROLE | undefined =
      roleParam === 'ADMIN' || roleParam === 'USER' || roleParam === 'STAFF'
        ? (roleParam as ROLE)
        : undefined
    const hasAvatar = parseAvatarFilter(searchParams.get('hasAvatar'))
    const hasActiveAccessParam = searchParams.get('hasActiveAccess')
    const hasActiveAccess: 'active' | 'inactive' | 'any' =
      hasActiveAccessParam === 'active' || hasActiveAccessParam === 'inactive'
        ? hasActiveAccessParam
        : 'any'
    const page = parsePage(searchParams.get('page'), 1)
    const pageSize = parsePage(
      searchParams.get('pageSize'),
      DEFAULT_PAGE_SIZE
    )
    const sortByParam = searchParams.get('sortBy')
    const sortBy: 'createdAt' | 'name' = sortByParam === 'name' ? 'name' : DEFAULT_SORT_BY
    const sortDirParam = searchParams.get('sortDir')
    const sortDir: 'asc' | 'desc' = sortDirParam === 'asc' ? 'asc' : DEFAULT_SORT_DIR

    return {
      id,
      email,
      phone,
      role,
      hasAvatar,
      hasActiveAccess,
      sortBy,
      sortDir,
      page,
      pageSize,
    }
  }, [searchParams])

  const query = adminUsersApi.admin.user.list.useQuery(filters, {
    staleTime: 30 * 1000,
    placeholderData: previousData => previousData,
  })

  return {
    ...query,
    filters,
    setFilter,
    setSorting,
    isPending,
  }
}
