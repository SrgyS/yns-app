'use client'

import React from 'react'
import { StartEffectsBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Check } from 'lucide-react'

export function StartEffectsBlockComponent({
  title,
  effects,
  nextStep,
  videoPlaceholder,
}: StartEffectsBlock) {
  return (
    <section className="grid gap-6 md:grid-cols-[0.9fr_1fr]">
      {/* Video Placeholder */}
      {videoPlaceholder && (
        <div className="relative aspect-16/11 overflow-hidden rounded-3xl border bg-muted/20">
          <div className="absolute inset-0 bg-linear-to-br from-muted/10 via-transparent to-muted/20" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Короткий ролик: техника
</div>
        </div>
      )}

      {/* Content Cards */}
      <div className="space-y-4">
        {title && (
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        )}

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">
              Что вы почувствуете уже на старте
            </CardTitle>
            <CardDescription>
              Эти эффекты дают телу сигнал безопасности и запускают восстановление
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {effects.map((effect, index) => (
              <div key={index} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{effect}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {nextStep && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">{nextStep.title}</CardTitle>
              <CardDescription>{nextStep.description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button className="w-full">{nextStep.cta}</Button>
              <Button variant="outline" className="w-full">
                Сравнить курсы
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </section>
  )
}
