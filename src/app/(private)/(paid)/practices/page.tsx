'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Card, CardDescription, CardTitle } from '@/shared/ui/card'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/shared/ui/sheet'

type PracticeTypeKey = 'warmup' | 'strength' | 'correction' | 'favorite' | 'bonus'

type PracticeType = {
  key: PracticeTypeKey
  title: string
  description: string
  imagePath?: string
}

type PracticeSubcategory = {
  key: string
  title: string
  description?: string
  imagePath?: string
}

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL

const buildImagePath = (relativePath: string | undefined) => {
  if (!relativePath || !imageBaseUrl) return relativePath

  const normalizedBase = imageBaseUrl.endsWith('/')
    ? imageBaseUrl.slice(0, -1)
    : imageBaseUrl
  const normalizedPath = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath

  return `${normalizedBase}/${normalizedPath}`
}

const PRACTICE_TYPES: PracticeType[] = [
  {
    key: 'warmup',
    title: 'Зарядки',
    description: 'Короткие комплексы для мягкого запуска дня.',
    imagePath: buildImagePath('practices/top-5.3a575ebf.webp'),
  },
  {
    key: 'strength',
    title: 'Силовые',
    description: 'Тренировки на укрепление мышц и развитие силы.',
    imagePath: buildImagePath('practices/course3.7eca204b.webp'),
  },
  {
    key: 'correction',
    title: 'Коррекция',
    description: 'Забота об осанке, балансе и подвижности.',
    imagePath: buildImagePath('practices/top-5.3a575ebf.webp'),
  },
  {
    key: 'favorite',
    title: 'Избранное',
    description: 'Собранные любимые тренировки в одном месте.',
    imagePath: buildImagePath('practices/course4-2.f43f5b9e.webp'),
  },
  {
    key: 'bonus',
    title: 'Бонусные тренировки',
    description: 'Дополнительные занятия для разнообразия программы.',
  },
]

const WARMUP_SUBCATEGORIES: PracticeSubcategory[] = [
  {
    key: 'swelling',
    title: 'От отеков',
    description: 'Мягкие движения для улучшения кровообращения.',
    imagePath: buildImagePath('practices/warmup-sub-swelling.webp'),
  },
  {
    key: 'pelvic-floor',
    title: 'Мышцы тазового дна (МТД)',
    description: 'Укрепление мышц ядра и стабилизация корпуса.',
    imagePath: buildImagePath('practices/warmup-sub-pelvic-floor.webp'),
  },
  {
    key: 'pelvis-spine',
    title: 'Таз + позвоночник',
    description: 'Освобождаем зажимы и возвращаем гибкость.',
    imagePath: buildImagePath('practices/warmup-sub-pelvis-spine.webp'),
  },
  {
    key: 'breath',
    title: 'Дыхание',
    description: 'Учимся дышать глубоко и ровно для энергии на день.',
    imagePath: buildImagePath('practices/warmup-sub-breath.webp'),
  },
  {
    key: 'joint',
    title: 'Суставная',
    description: 'Работаем над подвижностью всех крупных суставов.',
    imagePath: buildImagePath('practices/warmup-sub-joints.webp'),
  },
  {
    key: 'belly',
    title: 'Убираем живот',
    description: 'Активные упражнения для тонуса пресса.',
    imagePath: buildImagePath('practices/warmup-sub-belly.webp'),
  },
  {
    key: 'energy',
    title: 'Зарядись энергией',
    description: 'Бодрящие комплексы для отличного самочувствия.',
    imagePath: buildImagePath('practices/warmup-sub-energy.webp'),
  },
]

export default function Practices() {
  const [selectedType, setSelectedType] = useState<PracticeType | null>(null)

  const warmupSubcategories = useMemo(() => {
    if (selectedType?.key !== 'warmup') return []
    return WARMUP_SUBCATEGORIES
  }, [selectedType])

  const handleSelectType = (type: PracticeType) => {
    if (type.key !== 'warmup') return
    setSelectedType(type)
  }

  return (
    <Sheet
      open={Boolean(selectedType)}
      onOpenChange={open => {
        if (!open) {
          setSelectedType(null)
        }
      }}
    >
      <div className="container space-y-8 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Отдельные тренировки</h1>
          <p className="text-muted-foreground">
            Выберите подходящую категорию, чтобы быстро перейти к нужным
            тренировкам.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRACTICE_TYPES.map(type => (
            <PracticeTypeCard
              key={type.key}
              type={type}
              onSelect={type.key === 'warmup' ? () => handleSelectType(type) : undefined}
            />
          ))}
        </div>
      </div>

      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-xl overflow-y-auto border-border px-0 pb-10 sm:max-w-xl md:max-w-2xl lg:w-screen lg:max-w-none lg:border-none lg:rounded-none"
      >
        <div className="mx-auto w-full max-w-5xl px-6">
          {selectedType && <SectionHero type={selectedType} />}

          {warmupSubcategories.length > 0 && (
            <div className="space-y-4 pt-6">
              {warmupSubcategories.map(subcategory => (
                <PracticeSubcategoryCard
                  key={subcategory.key}
                  subcategory={subcategory}
                  parentKey={selectedType?.key ?? 'warmup'}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionHero({ type }: { type: PracticeType }) {
  const [isImageError, setIsImageError] = useState(false)
  const shouldRenderImage = Boolean(type.imagePath) && !isImageError

  return (
    <div className="relative flex h-56 flex-col">
      {shouldRenderImage ? (
        <div className="absolute inset-0">
          <Image
            src={type.imagePath!}
            alt={type.title}
            fill
            priority
            className="object-cover"
            onError={() => setIsImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/30 to-primary/20" />
      )}

      <div className="relative z-10 flex flex-col gap-6 px-6 pb-6 pt-6 md:pt-8">
        <div>
          <SheetClose asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
            >
              <ArrowLeft className="size-4" />
              Назад
            </button>
          </SheetClose>
        </div>

        <div className="flex flex-col gap-3 text-white">
          <div className="text-xs uppercase tracking-wide text-white/70">
            Раздел
          </div>
          <h2 className="text-2xl font-semibold">{type.title}</h2>
          {type.description && (
            <p className="text-sm text-white/80">{type.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

type PracticeTypeCardProps = {
  type: PracticeType
  onSelect?: () => void
}

function PracticeTypeCard({ type, onSelect }: PracticeTypeCardProps) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(type.imagePath) && !isImageError

  const CardBody = (
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
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 30vw, 40vw"
              priority={type.key === 'warmup'}
              onError={() => setIsImageError(true)}
            />
          </div>
        </div>
      )}
    </Card>
  )

  if (onSelect) {
    return (
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className="group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {CardBody}
        </button>
      </SheetTrigger>
    )
  }

  return (
    <Link
      href={`/practices?type=${type.key}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {CardBody}
    </Link>
  )
}

type PracticeSubcategoryCardProps = {
  subcategory: PracticeSubcategory
  parentKey: PracticeTypeKey
}

function PracticeSubcategoryCard({
  subcategory,
  parentKey,
}: PracticeSubcategoryCardProps) {
  const [isImageError, setIsImageError] = useState(false)
  const hasImage = Boolean(subcategory.imagePath) && !isImageError

  return (
    <Link
      href={`/practices/${parentKey}?subcategory=${subcategory.key}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="group flex min-h-[110px] flex-row items-center gap-4 overflow-hidden border-border/80 p-4 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/50 group-hover:shadow-lg">
        {hasImage && (
          <div className="relative h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40">
            <Image
              src={subcategory.imagePath!}
              alt={subcategory.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 15vw, 40vw"
              onError={() => setIsImageError(true)}
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {subcategory.title}
          </CardTitle>
          {subcategory.description && (
            <CardDescription className="text-sm text-foreground/70">
              {subcategory.description}
            </CardDescription>
          )}
        </div>
      </Card>
    </Link>
  )
}
