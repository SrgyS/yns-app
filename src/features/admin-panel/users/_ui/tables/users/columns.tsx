'use client'

import React from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'

import { ProfileAvatar } from '@/entities/user/client'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn } from '@/shared/ui/utils'

import { AdminUserListItem, AdminUserListFilters } from '../../../_domain/types'
import { AdminUsersFilterKey } from '../../../_hooks/use-admin-users'
import { Button } from '@/shared/ui/button'

const roleLabels: Record<AdminUserListItem['role'], string> = {
  ADMIN: 'Админ',
  STAFF: 'Сотрудник',
  USER: 'Ученик',
}

const roleVariants: Record<
  AdminUserListItem['role'],
  'default' | 'secondary' | 'outline'
> = {
  ADMIN: 'default',
  STAFF: 'secondary',
  USER: 'outline',
}

const ColumnHeader = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="space-y-1">
    <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    {children}
  </div>
)

const FilterInput = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) => (
  <div className="relative">
    <Input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn('h-8 pr-8', className)}
    />
    {value && (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onChange('')}
        className="absolute inset-y-0 right-1 cursor-pointer  text-xs text-muted-foreground"
      >
        ✕
      </Button>
    )}
  </div>
)

const IdHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="ID">
      <FilterInput
        value={filters.id ?? ''}
        onChange={value => onFilterChange('id', value)}
        placeholder="Поиск"
        className="w-24"
      />
    </ColumnHeader>
  )
}

const AvatarHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="Аватар">
      <Select
        value={filters.hasAvatar}
        onValueChange={value => onFilterChange('hasAvatar', value)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">--</SelectItem>
          <SelectItem value="with">Есть</SelectItem>
          <SelectItem value="without">Нет</SelectItem>
        </SelectContent>
      </Select>
    </ColumnHeader>
  )
}

const EmailHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="E-mail">
      <FilterInput
        value={filters.email ?? ''}
        onChange={value => onFilterChange('email', value)}
        placeholder="Поиск"
      />
    </ColumnHeader>
  )
}

const PhoneHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="Телефон">
      <FilterInput
        value={filters.phone ?? ''}
        onChange={value => onFilterChange('phone', value)}
        placeholder="Поиск"
      />
    </ColumnHeader>
  )
}

const RoleHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="Тип">
      <Select
        value={filters.role ?? 'all'}
        onValueChange={value => onFilterChange('role', value)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Все" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все</SelectItem>
          <SelectItem value="ADMIN">Админ</SelectItem>
          <SelectItem value="STAFF">Сотрудник</SelectItem>
          <SelectItem value="USER">Ученик</SelectItem>
        </SelectContent>
      </Select>
    </ColumnHeader>
  )
}

const AccessHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="Активный доступ">
      <Select
        value={filters.hasActiveAccess}
        onValueChange={value => onFilterChange('hasActiveAccess', value)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">--</SelectItem>
          <SelectItem value="active">Активен</SelectItem>
          <SelectItem value="inactive">Не активен</SelectItem>
        </SelectContent>
      </Select>
    </ColumnHeader>
  )
}

const NameHeader = ({ table }: { table: any }) => {
  const { filters, onFilterChange } = table.options.meta as {
    filters: AdminUserListFilters
    onFilterChange: (key: AdminUsersFilterKey, value: string) => void
  }
  return (
    <ColumnHeader label="Имя">
      <FilterInput
        value={filters.name ?? ''}
        onChange={value => onFilterChange('name', value)}
        placeholder="Поиск"
      />
    </ColumnHeader>
  )
}

export const adminUsersColumns: ColumnDef<AdminUserListItem>[] = [
  {
    accessorKey: 'id',
    header: ({ table }) => <IdHeader table={table} />,
    cell: ({ row }) => (
      <Link
        href={`/admin/users/${row.original.id}`}
        title={row.original.id}
        className="inline-block max-w-24 truncate font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: 'image',
    enableSorting: false,
    header: ({ table }) => <AvatarHeader table={table} />,
    cell: ({ row }) => {
      const profile = {
        email: row.original.email,
        name: row.original.name,
        image: row.original.image ?? undefined,
      }

      return (
        <Link
          href={`/admin/users/${row.original.id}`}
          className="inline-flex items-center"
        >
          <ProfileAvatar profile={profile} className="size-10" />
        </Link>
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ table }) => <EmailHeader table={table} />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Link
          href={`/admin/users/${row.original.id}`}
          className="text-sm font-medium hover:underline"
        >
          {row.original.email}
        </Link>
        <span className="text-xs text-muted-foreground">
          {row.original.name || 'Имя не указано'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ table }) => <NameHeader table={table} />,
    cell: ({ row }) => (
      <Link
        href={`/admin/users/${row.original.id}`}
        className="text-sm font-medium hover:underline"
      >
        {row.original.name || '—'}
      </Link>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ table }) => <PhoneHeader table={table} />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.phone ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ table }) => <RoleHeader table={table} />,
    cell: ({ row }) => (
      <Badge variant={roleVariants[row.original.role]}>
        {roleLabels[row.original.role]}
      </Badge>
    ),
  },
  {
    accessorKey: 'hasActiveAccess',
    header: ({ table }) => <AccessHeader table={table} />,
    cell: ({ row }) => (
      <Badge
        variant={row.original.hasActiveAccess ? 'default' : 'outline'}
        className={cn(
          !row.original.hasActiveAccess &&
            'text-muted-foreground border-muted-foreground/40'
        )}
      >
        {row.original.hasActiveAccess ? 'Есть' : 'Нет'}
      </Badge>
    ),
  },
]
