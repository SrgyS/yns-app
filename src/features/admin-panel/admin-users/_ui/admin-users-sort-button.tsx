"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Button } from '@/shared/ui/button'
import { ArrowDownWideNarrow } from 'lucide-react'

type SortOption = {
  id: string
  label: string
  sortBy: 'createdAt' | 'name'
  sortDir: 'asc' | 'desc'
}

const sortOptions: SortOption[] = [
  {
    id: 'createdAt_desc',
    label: 'Новые сначала',
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
  {
    id: 'createdAt_asc',
    label: 'Старые сначала',
    sortBy: 'createdAt',
    sortDir: 'asc',
  },
  {
    id: 'name_asc',
    label: 'По алфавиту A–Я',
    sortBy: 'name',
    sortDir: 'asc',
  },
  {
    id: 'name_desc',
    label: 'По алфавиту Я–A',
    sortBy: 'name',
    sortDir: 'desc',
  },
]

type AdminUsersSortButtonProps = {
  sortBy: 'createdAt' | 'name'
  sortDir: 'asc' | 'desc'
  onChange: (sortBy: 'createdAt' | 'name', sortDir: 'asc' | 'desc') => void
}

export function AdminUsersSortButton({ sortBy, sortDir, onChange }: AdminUsersSortButtonProps) {
  const activeId = `${sortBy}_${sortDir}`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowDownWideNarrow className="h-4 w-4" />
          Сортировка
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {sortOptions.map(option => (
          <DropdownMenuItem
            key={option.id}
            className={option.id === activeId ? 'font-semibold text-primary' : ''}
            onClick={() => onChange(option.sortBy, option.sortDir)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
