'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

import type { PracticeType } from '../_domain/practice-types'

type PracticeTypeCardProps = {
  type: PracticeType
  onSelect?: () => void
}

export function PracticeTypeCard({ type, onSelect }: PracticeTypeCardProps) {
  return (
    <Card key={type.key} onClick={onSelect} className="cursor-pointer">
      <CardHeader>
        <CardTitle>{type.title}</CardTitle>
        <CardDescription>{type.description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
