"use client"

import { useState } from "react"

import { Heart } from "lucide-react"
import { Button } from "./button"

export function FavoriteButton() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Button
      variant="ghost" // без обводки, минималистично
      size="icon" // квадратная кнопка для иконки
      onClick={() => setIsFavorite(!isFavorite)}
      aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
    >
      {isFavorite ? (
        <Heart className="size-5 text-red-500 fill-red-500" />
      ) : (
        <Heart className="size-5 text-gray-300/50" />
      )}
    </Button>
  )
}