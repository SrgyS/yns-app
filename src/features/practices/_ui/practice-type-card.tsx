'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Card, CardDescription, CardTitle } from '@/shared/ui/card'
import { cn } from '@/shared/ui/utils'
import type { PracticeType } from '../_domain/practice-types'

type PracticeTypeCardProps = {
  type: PracticeType
  onSelect?: () => void
}

export function PracticeTypeCard({ type, onSelect }: PracticeTypeCardProps) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(type.imagePath) && !isImageError
  const isInteractive = Boolean(onSelect)

  const card = (
    <Card className="group flex min-h-[110px] flex-row items-stretch overflow-hidden border-border/80 p-1 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg md:p-4">
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-6">
        <CardTitle className="text-xl font-semibold text-foreground">
          {type.title}
        </CardTitle>
        {type.description && (
          <CardDescription className="text-sm text-foreground/70">
            {type.description}
          </CardDescription>
        )}
      </div>

      {hasImage && (
        <div className="relative flex w-32 flex-shrink-0 items-center justify-center px-4 py-6 sm:w-48">
          <div className="relative h-36 w-full overflow-hidden rounded-xl border border-border/60 bg-muted/40 sm:h-40">
            <Image
              src={type.imagePath!}
              alt={type.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              onError={() => setIsImageError(true)}
            />
          </div>
        </div>
      )}
    </Card>
  )

  if (!isInteractive) {
    return card
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      {card}
    </button>
  )
}
