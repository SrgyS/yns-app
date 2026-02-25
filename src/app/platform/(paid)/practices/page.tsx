'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  PRACTICE_TYPES,
  PRACTICE_GROUPS,
} from '@/features/practices/_constants/practice-types'
import type {
  PracticeSubcategory,
  PracticeType,
} from '@/features/practices/_domain/practice-types'
import { PracticeSectionHero } from '@/features/practices/_ui/practice-section-hero'
import { PracticeSubcategoryCard } from '@/features/practices/_ui/practice-subcategory-card'
import { PracticeTypeCard } from '@/features/practices/_ui/practice-type-card'
import { PracticeGroupCard } from '@/features/practices/_ui/practice-group-card'

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
    router.replace(`/platform/practices?section=${sectionSegment}`, {
      scroll: false,
    })
  }

  const handleCloseCategories = () => {
    setSelectedType(null)
    router.replace('/platform/practices', { scroll: false })
  }

  const handleSelectSubcategory = (subcategory: PracticeSubcategory) => {
    if (!selectedType) return

    const sectionSegment = encodeURIComponent(
      selectedType.section.toLowerCase()
    )
    const subsectionSegment = encodeURIComponent(
      subcategory.value.toLowerCase()
    )

    router.push(`/platform/practices/${sectionSegment}/${subsectionSegment}`)
  }

  if (!selectedType) {
    return (
      <div className="space-y-8 py-4 sm:pt-14 max-w-2xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Отдельные тренировки</h1>
          <p className="text-muted-foreground">
            Выберите подходящую категорию, чтобы быстро перейти к нужным
            тренировкам.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRACTICE_GROUPS.length > 0 &&
            PRACTICE_GROUPS.map(group => {
              const sectionSegment = encodeURIComponent(group.key)
              return (
                <Link
                  key={group.key}
                  href={`/platform/practices/${sectionSegment}`}
                >
                  <PracticeGroupCard group={group} />
                </Link>
              )
            })}

          {PRACTICE_TYPES.map(type => {
            if (type.subcategories.length === 0) {
              const sectionSegment = encodeURIComponent(
                type.section.toLowerCase()
              )

              return (
                <Link
                  key={type.key}
                  href={`/platform/practices?section=${sectionSegment}`}
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
    <div className="space-y-6 py-4 sm:pt-14 max-w-2xl mx-auto">
      <PracticeSectionHero
        practiceType={selectedType}
        onBack={handleCloseCategories}
      />

      {subcategories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
