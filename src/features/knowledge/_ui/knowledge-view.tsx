'use client'

import { useMemo } from 'react'
import { Card, CardContent} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type KnowledgeCategory = {
  id: string
  title: string
  description: string | null
  order: number | null
  articles: Array<{
    id: string
    title: string
    description: string | null
    content: string | null
    videoId: string | null
    attachments: any
    order: number
  }>
}

type KnowledgeViewProps = {
  initialCourseId: string | null
  courses: Array<{ id: string; title: string }>
  knowledgeByCourse: Array<{ courseId: string; categories: KnowledgeCategory[] }>
}

export function KnowledgeView({
  knowledgeByCourse,
}: Readonly<KnowledgeViewProps>) {
  const allCategories = useMemo(
    () =>
      knowledgeByCourse.flatMap(entry =>
        entry.categories.map(category => ({
          courseId: entry.courseId,
          category,
        }))
      ),
    [knowledgeByCourse]
  )

  const hasData = allCategories.length > 0

  return (
    <section className="space-y-6 py-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              База знаний
            </p>
            <h1 className="text-2xl font-semibold leading-tight">
              Ваши материалы по курсу
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Все темы из ваших активных курсов. Открывайте и изучайте в удобном
          формате.
        </p>
      </header>

      {hasData ? (
        <div className="rounded-xl border bg-card/50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allCategories.map(({ category, courseId }) => (
              <KnowledgeCategoryCard
                key={`${courseId}-${category.id}`}
                category={category}
                courseId={courseId}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            Пока нет доступных материалов. Проверьте активные курсы или обновите
            доступ.
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function KnowledgeCategoryCard({
  category,
  courseId,
}: Readonly<{
  category: KnowledgeCategory
  courseId: string
}>) {
  return (
    <Card className="relative border border-border/70 bg-card/80 transition hover:shadow-md hover:border-primary/40">
      <div className="aspect-4/3 w-full rounded-t-lg bg-linear-to-br from-slate-900 via-slate-700 to-slate-500 flex items-end justify-start px-4 pb-3">
        <span className="text-white text-lg font-semibold line-clamp-2">
          {category.title}
        </span>
      </div>
      <CardContent className="space-y-3 pt-4">
        {category.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {category.description}
          </p>
        ) : null}
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="gap-2 justify-start"
        >
          <Link href={`/platform/knowledge/${category.id}?courseId=${courseId}`}>
            Открыть
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
