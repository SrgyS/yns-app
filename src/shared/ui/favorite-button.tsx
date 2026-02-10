'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

import { Button } from './button'

type FavoriteButtonProps = {
  isFavorite: boolean
  onToggle: () => Promise<void>
  disabled?: boolean
  isLoading?: boolean
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  disabled = false,
  isLoading = false,
}: FavoriteButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (disabled || isLoading || isPending) {
      return
    }

    try {
      setIsPending(true)
      await onToggle()
    } finally {
      setIsPending(false)
    }
  }

  const ariaLabel = isFavorite
    ? 'Удалить из избранного'
    : 'Добавить в избранное'
  const isDisabled = disabled || isLoading || isPending

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-busy={isDisabled}
      aria-label={ariaLabel}
      disabled={isDisabled}
      className="rounded-full p-2 dark:bg-black/80 dark:hover:bg-black/70 disabled:bg-background disabled:opacity-100 dark:disabled:bg-black/60"
    >
      {isFavorite ? (
        <Heart className="size-5 text-rose-500 fill-current" />
      ) : (
        <Heart className="size-5 text-muted-foreground" />
      )}
    </Button>
  )
}
