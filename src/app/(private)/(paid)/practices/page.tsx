'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { cn } from '@/shared/ui/utils'

type PracticeType = {
  key: 'warmup' | 'strength' | 'correction' | 'favorite' | 'bonus'
  title: string
  description: string
  imagePath?: string
}

const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL

const PRACTICE_TYPES: PracticeType[] = [
  {
    key: 'warmup',
    title: 'Зарядки',
    description: 'Короткие комплексы для мягкого запуска дня.',
    imagePath: `${baseUrl}/practices/top-5.3a575ebf.webp`,
  },
  {
    key: 'strength',
    title: 'Силовые',
    description: 'Тренировки на укрепление мышц и развитие силы.',
    imagePath: `${baseUrl}/practices/course3.7eca204b.webp`,
  },
  {
    key: 'correction',
    title: 'Коррекция',
    description: 'Забота об осанке, балансе и подвижности.',
    imagePath: `${baseUrl}/practices/top-5.3a575ebf.webp`,
  },
  {
    key: 'favorite',
    title: 'Избранное',
    description: 'Собранные любимые тренировки в одном месте.',
    imagePath: `${baseUrl}/practices/course4-2.f43f5b9e.webp`,
  },
  {
    key: 'bonus',
    title: 'Бонусные тренировки',
    description: 'Дополнительные занятия для разнообразия программы.',
  },
]

export default function Practices() {
  return (
    <div className="container space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Отдельные тренировки</h1>
        <p className="text-muted-foreground">
          Выберите подходящую категорию, чтобы быстро перейти к нужным
          тренировкам.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PRACTICE_TYPES.map(type => (
          <PracticeTypeCard key={type.key} type={type} />
        ))}
      </div>
    </div>
  )
}

function PracticeTypeCard({ type }: { type: PracticeType }) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(type.imagePath) && !isImageError

  return (
    <Link
      href={`/practices?type=${type.key}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        className={cn(
          'group relative h-full overflow-hidden border-border/80 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg',
          hasImage && 'gap-0 bg-card/60'
        )}
      >
        {hasImage && (
          <>
            <Image
              src={type.imagePath!}
              alt={type.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={type.key === 'warmup'}
              onError={() => setIsImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20" />
          </>
        )}

        <CardHeader className={cn('gap-3', hasImage && 'relative z-10 text-white')}>
          <CardTitle className="text-xl font-semibold">{type.title}</CardTitle>
          <CardDescription
            className={cn(
              hasImage
                ? 'text-base text-white/80'
                : 'text-base text-foreground/80'
            )}
          >
            {type.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
