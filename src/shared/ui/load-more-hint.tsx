import React from 'react'

import { Spinner } from './spinner'
import { cn } from './utils'

type LoadMoreHintProps = {
  isLoadingMore: boolean
  hasNextPage: boolean
  loadingText?: string
  moreText?: string
  endText?: string
  className?: string
}

export const LoadMoreHint = React.forwardRef<
  HTMLDivElement,
  LoadMoreHintProps
>(
  (
    {
      isLoadingMore,
      hasNextPage,
      loadingText = 'Загружаем ещё...',
      moreText = 'Прокрутите ниже, чтобы загрузить больше',
      endText = 'Все данные загружены',
      className,
    },
    ref
  ) => {
    let content: React.ReactNode = endText

    if (isLoadingMore) {
      content = (
        <>
          <Spinner className="h-3 w-3" /> {loadingText}
        </>
      )
    } else if (hasNextPage) {
      content = moreText
    }

    return (
      <div
        ref={ref}
        className={cn('py-2 text-center text-xs text-muted-foreground', className)}
      >
        {content}
      </div>
    )
  }
)

LoadMoreHint.displayName = 'LoadMoreHint'
