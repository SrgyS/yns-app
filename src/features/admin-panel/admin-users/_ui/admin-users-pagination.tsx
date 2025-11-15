"use client"

import { Button } from '@/shared/ui/button'

type AdminUsersPaginationProps = {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function AdminUsersPagination({ page, pageCount, onChange }: AdminUsersPaginationProps) {

  const canPrev = page > 1
  const canNext = pageCount === 0 ? false : page < pageCount

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="text-xs text-muted-foreground">
        Страница {page} из {pageCount || 1}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={!canPrev}
        >
          Назад
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={!canNext}
        >
          Далее
        </Button>
      </div>
    </div>
  )
}
