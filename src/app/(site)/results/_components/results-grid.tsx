import { AppImage } from '@/shared/ui/app-image'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

type ResultStory = {
  id: string
  name: string
  course: string
  period: string
  resultImageUrl: string
  story: string[]
}

type ResultsGridProps = {
  items: ResultStory[]
}

export function ResultsGrid({ items }: ResultsGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6">
      {items.map(item => (
        <Card key={item.id} className="overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            <div className="grid gap-4 p-4 md:items-start md:gap-5 md:p-6 lg:grid-cols-[200px_1fr]">
              <div className="relative mx-auto aspect-5/4  w-full overflow-hidden rounded-2xl border bg-muted/20 md:mx-0 md:max-w-none">
                <AppImage
                  src={item.resultImageUrl}
                  alt={`Результат до и после: ${item.name}`}
                  fill
                  sizes="(max-width: 767px) 220px, (max-width: 1279px) 180px, 200px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {item.course}
                  </p>
                  <p className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                    {item.period}
                  </p>
                </div>
                <h2 className="text-lg font-semibold tracking-tight md:text-xl">
                  {item.name}
                </h2>
                <p className="line-clamp-4 whitespace-pre-line text-sm text-foreground/85">
                  {item.story.join('\n\n')}
                </p>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="h-auto p-0 text-sm">
                      Читать весь отзыв
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{item.name}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 text-sm text-foreground/90">
                      {item.story.map(paragraph => (
                        <p key={`${item.id}-${paragraph}`}>{paragraph}</p>
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
