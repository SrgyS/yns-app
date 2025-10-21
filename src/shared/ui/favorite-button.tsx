"use client"

import { useState } from "react"

import { Heart } from "lucide-react"
import { Button } from "./button"

export function FavoriteButton() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Button
      variant="outline"
      size="icon" 
      onClick={() => setIsFavorite(!isFavorite)}
      aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      className="rounded-full p-2 dark:bg-black/80 dark:hover:bg-black/70"
    >
      {isFavorite ? (
        <Heart className="size-5 text-rose-500 fill-current" />
      ) : (
        <Heart className="size-5 text-muted-foreground" />
      )}
    </Button>
  )
}