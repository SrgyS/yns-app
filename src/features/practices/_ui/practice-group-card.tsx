'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { PracticeGroup } from '../_domain/practice-types'

type PracticeGroupCardProps = {
  group: PracticeGroup
  onSelect?: () => void
}

export function PracticeGroupCard({ group, onSelect }: PracticeGroupCardProps) {
  return (
    <Card
      key={group.key}
      onClick={onSelect}
      className={onSelect ? 'cursor-pointer' : undefined}
    >
      <CardHeader>
        <CardTitle>{group.title}</CardTitle>
        {group.description && (
          <CardDescription>{group.description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  )
}
