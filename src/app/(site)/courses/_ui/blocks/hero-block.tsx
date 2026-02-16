'use client'

import React from 'react'
import Link from 'next/link'
import { HeroBlock, VideoBlock } from '@/kernel/domain/course-page'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { AppImage } from '@/shared/ui/app-image'
import { Course } from '@/entities/course'
import { Check, Clock3, Dumbbell, Shield, type LucideIcon } from 'lucide-react'
import { MdxCode } from '@/shared/lib/mdx'
import { VideoBlockComponent } from './video-block'

const HERO_BADGE_ICONS: Record<string, LucideIcon> = {
  clock: Clock3,
  shield: Shield,
  dumbbell: Dumbbell,
}

export function HeroBlockComponent({
  image,
  badges,
  quickOutcomes,
  primaryAction,
  secondaryAction,
  sideCard,
  course,
  embeddedVideo,
}: HeroBlock & { course?: Course; embeddedVideo?: VideoBlock }) {
  const title = course?.title
  const description = course?.shortDescription

  let finalImage: string | undefined
  if (image) {
    finalImage = image
  } else if (course?.image) {
    finalImage = course.image
  }

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-3xl border">
        {/* Background Image */}
        <div className="absolute inset-0">
          {finalImage && (
            <AppImage
              src={finalImage}
              alt={title || 'Hero'}
              fill
              priority
              className="object-cover -scale-x-100 "
              sizes="100vw"
            />
          )}
          {/* <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/55 to-background/15" />
        <div className="absolute inset-0 bg-linear-to-t from-background/65 via-transparent to-transparent" /> */}
        </div>

        {/* Content */}
        <div className="relative p-4 sm:p-5 md:p-10">
          <div className="grid gap-4 md:grid-cols-[1fr_340px] md:gap-6">
            {/* Left Column - Main Content */}
            <div className="w-full min-w-0 max-w-xl overflow-hidden rounded-3xl border bg-background/65 p-4 backdrop-blur-xs sm:p-5 md:p-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="rounded-full">
                  Старт после покупки
                </Badge>

                {/* Title */}
                <h1 className="break-words text-2xl font-semibold leading-tight tracking-tight sm:text-3xl md:text-5xl">
                  {title}
                </h1>

                {/* Tagline/Description */}
                {description && (
                  <div className="max-w-xl break-words text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                    <MdxCode code={description} />
                  </div>
                )}
                {/* Badges */}
                {badges && badges.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {badges.map((badge, index) => {
                      const BadgeIcon = badge.icon
                        ? HERO_BADGE_ICONS[badge.icon]
                        : undefined

                      return (
                        <Badge
                          key={index}
                          variant="outline"
                          className="max-w-full whitespace-normal rounded-full bg-background/60 py-1 leading-snug break-words"
                        >
                          <span className="inline-flex max-w-full items-start gap-1.5 break-words">
                            {BadgeIcon && <BadgeIcon className="h-3.5 w-3.5" />}
                            <span>{badge.label}</span>
                          </span>
                        </Badge>
                      )
                    })}
                  </div>
                )}

                {/* Quick Outcomes */}
                {quickOutcomes && quickOutcomes.length > 0 && (
                  <div className="grid gap-2">
                    {quickOutcomes.map((outcome, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-xs sm:text-sm"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="break-words text-muted-foreground">
                          {outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  {primaryAction && (
                    <Button size="lg" asChild>
                      <Link href={primaryAction.href}>
                        {primaryAction.label}
                      </Link>
                    </Button>
                  )}
                  {secondaryAction && (
                    <Button size="lg" variant="outline" asChild>
                      <Link href={secondaryAction.href}>
                        {secondaryAction.label}
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                  *Курс не является медицинской услугой. При противопоказаниях
                  нужна консультация врача.
                </div>
              </div>
            </div>

            {/* Right Column - Side Card */}
            {sideCard && (
              <div className="min-w-0 md:relative">
                <div className="md:sticky md:top-6">
                  <Card className="w-full min-w-0 rounded-3xl bg-background/75 backdrop-blur">
                    <CardHeader className="p-4 sm:p-5">
                      <CardTitle className="break-words text-sm sm:text-base">
                        {sideCard.title}
                      </CardTitle>
                      <CardDescription className="break-words text-xs sm:text-sm">
                        {sideCard.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                      {sideCard.items && sideCard.items.length > 0 && (
                        <div className="grid gap-2">
                          {sideCard.items.map((item, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border bg-muted/20 p-3"
                            >
                              <div className="break-words text-xs font-medium">
                                {item.title}
                              </div>
                              <div className="mt-1 break-words text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Media Placeholders */}
                      {sideCard.mediaPlaceholders &&
                        sideCard.mediaPlaceholders > 0 && (
                          <>
                            <Separator />
                            <div className="flex gap-2">
                              <Button className="w-full">Выбрать тариф</Button>
                              <Button variant="outline" className="w-full">
                                Вопрос
                              </Button>
                            </div>
                          </>
                        )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>

        {embeddedVideo && (
          <div className="absolute bottom-5 right-5 z-10 hidden w-[300px]  md:block">
            <Badge
              variant="secondary"
              className="pointer-events-none mb-3 p-2 rounded-2xl bg-background/65 backdrop-blur-xs "
            >
              Бесплатная тренировка
            </Badge>
            <div className="relative rounded-3xl border bg-background/65 p-4 backdrop-blur-xs">
              <VideoBlockComponent {...embeddedVideo} variant="compact" />
            </div>
          </div>
        )}
      </section>

      {embeddedVideo && (
        <div className="md:hidden">
          <div className="rounded-3xl border bg-background/65 p-4 backdrop-blur-xs">
            <Badge variant="secondary" className="mb-3 rounded-full">
              Бесплатная тренировка
            </Badge>
            <VideoBlockComponent
              {...embeddedVideo}
              variant="compact"
              showTitle
            />
          </div>
        </div>
      )}
    </div>
  )
}
