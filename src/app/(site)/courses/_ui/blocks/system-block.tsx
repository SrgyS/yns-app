'use client'

import React from 'react'
import { SystemBlock } from '@/kernel/domain/course-page'
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Sparkles,
  HeartPulse,
  Check,
  Clock,
  Dumbbell,
  Shield,
} from 'lucide-react'

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-5 w-5" />,
  heartpulse: <HeartPulse className="h-5 w-5" />,
  check: <Check className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
}

export function SystemBlockComponent({ title, cards }: SystemBlock) {
  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card, index) => {
          const icon = card.icon
            ? iconMap[card.icon.toLowerCase()]
            : iconMap.check

          return (
            <Card key={index} className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-muted-foreground">{icon}</span>
                  <span>{card.title}</span>
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
