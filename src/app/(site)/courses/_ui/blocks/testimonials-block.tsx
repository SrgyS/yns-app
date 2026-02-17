'use client'

import React from 'react'
import { TestimonialsBlock } from '@/kernel/domain/course-page'
import { Card, CardContent } from '@/shared/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { UserRound } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel'

export function TestimonialsBlockComponent({
  title,
  items,
}: TestimonialsBlock) {
  const getAuthorInitials = (author: string | undefined) => {
    if (!author) {
      return 'УК'
    }

    const words = author
      .split(' ')
      .map(word => word.trim())
      .filter(Boolean)

    const first = words[0]?.[0] ?? ''
    const second = words[1]?.[0] ?? ''

    return `${first}${second}`.toUpperCase() || 'УК'
  }

  const testimonials = items.map(item => ({
    content: item.text,
    name: item.author || 'Участница курса',
    role: item.authorRole || 'Участница программы',
    avatar: item.avatar,
  }))

  if (testimonials.length === 0) {
    return null
  }

  const hasMultiple = testimonials.length > 1

  return (
    <section className="py-5 md:py-8">
      <Carousel
        className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-1 md:grid-cols-2 md:gap-10"
        opts={{
          align: 'start',
          slidesToScroll: 1,
        }}
      >
        <div className="space-y-4 md:space-y-10">
          <div className="space-y-3">
            <Badge variant="outline" className="text-sm font-normal">
              Отзывы
            </Badge>
            <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
              {title || 'Отзывы участниц'}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Реальные впечатления учениц после прохождения программы.
            </p>
          </div>

          {hasMultiple && (
            <div className="flex items-center gap-3">
              <CarouselPrevious
                variant="default"
                className="static size-9 translate-y-0 rounded-full"
              />
              <CarouselNext
                variant="default"
                className="static size-9 translate-y-0 rounded-full"
              />
            </div>
          )}
        </div>

        <div className="relative">
          <CarouselContent className="md:-ml-6">
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:pl-6">
                <Card className="rounded-3xl border gap-0">
                  <div className="pl-5 md:pl-6">
                    <Avatar className="h-12 w-12 bg-slate-300">
                      {testimonial.avatar && (
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                        {testimonial.avatar ? (
                          getAuthorInitials(testimonial.name)
                        ) : (
                          <UserRound className="h-8 w-8 text-zinc-500" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardContent className="relative flex flex-col gap-6 p-5 md:p-6">
                    <div className="">
                      <p className="h-10 text-6xl leading-none text-primary/70">
                        &ldquo;
                      </p>
                      <p className="text-muted-foreground text-base font-medium sm:text-xl">
                        {testimonial.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>
    </section>
  )
}
