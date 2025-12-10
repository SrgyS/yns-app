import Link from 'next/link'
import { server } from '@/app/server'
import { GetUserKnowledgeService } from '@/features/knowledge/module'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { ArrowLeft, ArrowRight, FileText, Play } from 'lucide-react'

type Props = {
  params: { categoryId: string }
  searchParams?: { courseId?: string }
}

export default async function KnowledgeCategoryPage({
  params,
  searchParams,
}: Props) {
  const courseId = (await Promise.resolve(searchParams?.courseId)) ?? undefined
  const categoryId = (await Promise.resolve(params)).categoryId
  const knowledgeService = server.get(GetUserKnowledgeService)

  const categoryData =
    courseId && categoryId
      ? await knowledgeService.getCategory(courseId, categoryId)
      : null

  if (!categoryData) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="gap-2">
          <Link href="/knowledge">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Материал не найден или недоступен.
          </CardContent>
        </Card>
      </div>
    )
  }

  const { category } = categoryData

  return (
    <div className="container space-y-6">
      <div className="flex justify-start flex-col gap-3">
        <Button asChild variant="ghost" className="gap-2">
          <Link href={`/knowledge?courseId=${categoryData.courseId}`}>
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Тема
          </p>
          <h1 className="text-xl font-semibold leading-tight">
            {category.title}
          </h1>
        </div>
      </div>

      {category.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Описание</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {category.description}
          </CardContent>
        </Card>
      ) : null}

      <div className=" grid gap-3">
        {category.articles.map(article => (
          <Card key={article.id} className="border border-border/70 bg-card/80">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {article.title}
                </CardTitle>
                {article.description ? (
                  <p className="text-sm text-muted-foreground">
                    {article.description}
                  </p>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              {article.content ? (
                <p className="whitespace-pre-wrap text-foreground">
                  {article.content}
                </p>
              ) : null}

              {article.videoId ? (
                <div className="space-y-2">
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center border">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Play className="h-6 w-6" />
                      <span>Видео доступно</span>
                      <span className="text-xs">ID: {article.videoId}</span>
                    </div>
                  </div>
                  <Button variant="secondary" className="gap-2">
                    Смотреть
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}

              {Array.isArray(article.attachments) &&
              article.attachments.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Файлы
                  </p>
                  <div className="grid gap-2">
                    {article.attachments.map((file: any) => (
                      <Button
                        key={file.url}
                        asChild
                        variant="outline"
                        className="justify-start gap-2"
                      >
                        <Link href={file.url} target="_blank" rel="noreferrer">
                          <FileText className="h-4 w-4" />
                          {file.name || 'Файл'}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
