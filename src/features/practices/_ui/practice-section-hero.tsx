'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { PracticeType } from '../_domain/practice-types'
import { Button } from '@/shared/ui/button'
import { AppImage } from '@/shared/ui/app-image'

type PracticeSectionHeroProps = {
  practiceType: PracticeType
  onBack: () => void
}

export function PracticeSectionHero({
  practiceType,
  onBack,
}: PracticeSectionHeroProps) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(practiceType.imagePath) && !isImageError

  return (
    <div className="relative flex h-56 flex-col overflow-hidden rounded-2xl border border-border/60">
      {hasImage ? (
        <AppImage
          src={practiceType.imagePath!}
          alt={practiceType.title}
          fill
          priority
          className="object-cover"
          onError={() => setIsImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/30 to-primary/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

      <div className="relative z-10 flex flex-col gap-6 px-6 pb-6 pt-6 md:pt-8">
        <div>
          <Button type="button" onClick={onBack} size="icon" variant="outline">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Назад</span>
          </Button>
        </div>

        <div className="flex flex-col gap-2 text-white">
          <div className="text-xs uppercase tracking-wide text-white/70">
            Раздел
          </div>
          <h2 className="text-2xl font-semibold">{practiceType.title}</h2>
          {practiceType.description && (
            <p className="text-sm text-white/80">{practiceType.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
