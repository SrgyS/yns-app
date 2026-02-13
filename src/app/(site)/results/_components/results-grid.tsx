'use client'

import { AppImage } from '@/shared/ui/app-image'

import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

type ResultStory = {
  id: string
  name: string
  course: string
  imageUrl: string
  excerpt: string
  story: string[]
}

type ResultsGridProps = {
  items: ResultStory[]
}

export function ResultsGrid({ items }: ResultsGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {items.map(item => (
        <Card key={item.id} className="overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="grid sm:grid-cols-[220px_1fr]">
              <div className="relative h-56 sm:h-full">
                <AppImage
                  src={item.imageUrl}
                  alt={`История ${item.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 220px"
                />
              </div>
              <div className="flex h-full flex-col gap-4 p-6">
                <div className="text-right text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {item.course}
                </div>
                <div className="text-lg font-semibold">{item.name}</div>
                <p className="text-sm text-muted-foreground">{item.excerpt}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-fit rounded-2xl">
                      Читать историю
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{item.name}</DialogTitle>
                      <DialogDescription>{item.course}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-foreground">
                      {item.story.map((paragraph, index) => (
                        <p key={`${item.id}-p-${index}`}>{paragraph}</p>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
