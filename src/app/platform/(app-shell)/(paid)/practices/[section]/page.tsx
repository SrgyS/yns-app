import { notFound } from 'next/navigation'

import { FavoritePracticesScreen } from '@/features/practices'

export default async function PracticeSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params

  if (section.toLowerCase() !== 'favorite') {
    return notFound()
  }

  return <FavoritePracticesScreen />
}
