import { notFound } from 'next/navigation'
import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

import {
  findPracticeTypeBySection,
  findSubcategory,
} from '@/features/practices/_lib/practice-type-lookup'
import { PracticeSubsectionScreen } from '@/features/practices/_ui/practice-subsection-screen'

function mapSection(value: string): WorkoutSection | null {
  const upper = value.toUpperCase() as keyof typeof WorkoutSection
  return WorkoutSection[upper] ?? null
}

function mapSubsection(value: string): WorkoutSubsection | null {
  const upper = value.toUpperCase() as keyof typeof WorkoutSubsection
  return WorkoutSubsection[upper] ?? null
}

export default async function PracticeSubsectionPage({
  params,
}: {
  params: Promise<{ section: string; subsection: string }>
}) {
  const { section: sectionParam, subsection: subsectionParam } = await params

  const section = mapSection(sectionParam)
  const subsection = mapSubsection(subsectionParam)

  if (!section || !subsection) {
    return notFound()
  }

  const practiceType = findPracticeTypeBySection(section)
  const subcategory = findSubcategory(section, subsection)

  if (!practiceType || !subcategory) {
    return notFound()
  }

  return (
    <PracticeSubsectionScreen
      section={section}
      subsection={subsection}
      sectionTitle={practiceType.title}
      subcategoryTitle={subcategory.title}
      subcategoryDescription={subcategory.description}
      backHref={`/practices?section=${encodeURIComponent(sectionParam)}`}
    />
  )
}
