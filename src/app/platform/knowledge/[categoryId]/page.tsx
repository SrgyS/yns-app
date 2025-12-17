import Link from 'next/link'
import { server } from '@/app/server'
import { GetUserKnowledgeService } from '@/features/knowledge/module'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { ArrowLeft, FileText } from 'lucide-react'
import { MdxCode } from '@/shared/lib/mdx'
import { compileMDX } from '@/shared/lib/mdx/server'
import { formatDuration } from '@/shared/lib/format-duration'

type Props = {
  params: Promise<{ categoryId: string }>
  searchParams?: Promise<{ courseId?: string }>
}

export default async function KnowledgeCategoryPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const courseId = resolvedSearchParams?.courseId
  const categoryId = resolvedParams.categoryId
  const knowledgeService = server.get(GetUserKnowledgeService)

  const categoryData =
    courseId && categoryId
      ? await knowledgeService.getCategory(courseId, categoryId)
      : null

  if (!categoryData) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" className="gap-2 max-w-fit">
          <Link href="/platform/knowledge">
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

  const articlesWithMdx = await Promise.all(
    category.articles.map(async article => {
      if (article.contentMdx) {
        return { ...article, compiledContent: article.contentMdx }
      }
      const compiled = article.content
        ? await compileMDX(article.content)
        : null
      return { ...article, compiledContent: compiled?.code ?? null }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-start flex-col gap-3">
        <Button asChild variant="ghost" className="gap-2 max-w-fit">
          <Link href={`/platform/knowledge?courseId=${categoryData.courseId}`}>
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
        {articlesWithMdx.map(article => (
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
              {article.videoId ? (
                <div className="space-y-2">
                  <div
                    className="relative w-full overflow-hidden rounded-lg border bg-muted"
                    style={{ paddingTop: '56.25%' }}
                  >
                    {article.videoDurationSec !== null &&
                    article.videoDurationSec !== undefined ? (
                      <Badge className="absolute left-3 top-3 z-10">
                        {formatDuration(article.videoDurationSec)}
                      </Badge>
                    ) : null}
                    <iframe
                      src={`https://kinescope.io/embed/${article.videoId}`}
                      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                      title={article.title}
                    />
                  </div>
                </div>
              ) : null}
              {article.compiledContent ? (
                <MdxCode code={article.compiledContent} />
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
