'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { PRACTICE_TYPES } from '@/features/practices/_constants/practice-types'
import type {
  PracticeSubcategory,
  PracticeType,
} from '@/features/practices/_domain/practice-types'
import { PracticeSectionHero } from '@/features/practices/_ui/practice-section-hero'
import { PracticeSubcategoryCard } from '@/features/practices/_ui/practice-subcategory-card'
import { PracticeTypeCard } from '@/features/practices/_ui/practice-type-card'

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export default function PracticesPage() {
  const [selectedType, setSelectedType] = useState<PracticeType | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const sectionParam = searchParams.get('section')

  useEffect(() => {
    if (!sectionParam) {
      setSelectedType(null)
      return
    }

    const match = PRACTICE_TYPES.find(
      type => type.section.toLowerCase() === sectionParam.toLowerCase()
    )

    setSelectedType(match ?? null)
  }, [sectionParam])

  const subcategories = useMemo(() => {
    if (!selectedType) return []
    return selectedType.subcategories
  }, [selectedType])

  const handleSelectType = (type: PracticeType) => {
    if (type.subcategories.length === 0) return

    setSelectedType(type)
    const sectionSegment = encodeURIComponent(type.section.toLowerCase())
    router.replace(`/practices?section=${sectionSegment}`, { scroll: false })
  }

  const handleCloseCategories = () => {
    setSelectedType(null)
    router.replace('/practices', { scroll: false })
  }

  const handleSelectSubcategory = (subcategory: PracticeSubcategory) => {
    if (!selectedType) return

    const sectionSegment = encodeURIComponent(
      selectedType.section.toLowerCase()
    )
    const subsectionSegment = encodeURIComponent(
      subcategory.value.toLowerCase()
    )

    router.push(`/practices/${sectionSegment}/${subsectionSegment}`)
  }

  if (!selectedType) {
    return (
      <div className="container space-y-8 py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Отдельные тренировки</h1>
          <p className="text-muted-foreground">
            Выберите подходящую категорию, чтобы быстро перейти к нужным
            тренировкам.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRACTICE_TYPES.map(type => {
            if (type.subcategories.length === 0) {
              const sectionSegment = encodeURIComponent(
                type.section.toLowerCase()
              )

              return (
                <Link
                  key={type.key}
                  href={`/practices?section=${sectionSegment}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <PracticeTypeCard type={type} />
                </Link>
              )
            }

            return (
              <PracticeTypeCard
                key={type.key}
                type={type}
                onSelect={() => handleSelectType(type)}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-6 py-10">
      <PracticeSectionHero practiceType={selectedType} onBack={handleCloseCategories} />

      {subcategories.length > 0 ? (
        <div className="columns-1 gap-4 md:columns-2">
          {subcategories.map(subcategory => (
            <PracticeSubcategoryCard
              key={subcategory.key}
              subcategory={subcategory}
              onSelect={() => handleSelectSubcategory(subcategory)}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="Для этой категории пока нет подразделов." />
      )}
    </div>
  )
}
