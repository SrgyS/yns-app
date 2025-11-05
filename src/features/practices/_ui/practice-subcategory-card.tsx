'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/shared/ui/utils'
import type { PracticeSubcategory } from '../_domain/practice-types'

type PracticeSubcategoryCardProps = {
  subcategory: PracticeSubcategory
  onSelect: () => void
}

export function PracticeSubcategoryCard({
  subcategory,
  onSelect,
}: PracticeSubcategoryCardProps) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(subcategory.imagePath) && !isImageError

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group mb-4 flex w-full break-inside-avoid flex-row items-center gap-4 rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'border-border/80 bg-background'
      )}
    >
      {hasImage && (
        <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
          <Image
            src={subcategory.imagePath!}
            alt={subcategory.title}
            fill
            className="object-cover"
            onError={() => setIsImageError(true)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1">
        <span className="text-base font-semibold">{subcategory.title}</span>
        {subcategory.description && (
          <span className="text-sm text-muted-foreground">
            {subcategory.description}
          </span>
        )}
      </div>
    </button>
  )
}
