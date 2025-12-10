'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { skipToken } from '@tanstack/react-query'
import { adminKnowledgeApi } from '../_api'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { CategoryForm } from './category-form'
import { ArticleForm } from './article-form'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { toast } from 'sonner'
import { Badge } from '@/shared/ui/badge'

type CategoryListItem = {
  id: string
  title: string
  slug: string
  linked: boolean
  order: number | null
  _count?: { articles: number }
}

function arrayMove<T>(list: T[], from: number, to: number) {
  const updated = [...list]
  const [item] = updated.splice(from, 1)
  updated.splice(to, 0, item)
  return updated
}

function applySequentialOrder(list: CategoryListItem[]) {
  let position = 0
  return list.map(item =>
    item.linked ? { ...item, order: position++ } : { ...item, order: null }
  )
}

type CourseKnowledgeManagerProps = {
  courseId: string
}

export function CourseKnowledgeManager({ courseId }: CourseKnowledgeManagerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [items, setItems] = useState<CategoryListItem[]>([])
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [creatingArticle, setCreatingArticle] = useState(false)
  const [showGlobalImpactDialog, setShowGlobalImpactDialog] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [articleItems, setArticleItems] = useState<any[]>([])
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(null)

  const categoriesQuery = adminKnowledgeApi.adminKnowledge.categories.listForCourse.useQuery({
    courseId,
  })

  const { data: articles, refetch: refetchArticles } = adminKnowledgeApi.adminKnowledge.articles.list.useQuery(
    selectedCategoryId ? { categoryId: selectedCategoryId } : skipToken
  )

  const linkMutation = adminKnowledgeApi.adminKnowledge.categories.link.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success('Тема добавлена в курс')
    },
    onError: (err) => toast.error(err.message),
  })

  const unlinkMutation = adminKnowledgeApi.adminKnowledge.categories.unlink.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success('Тема исключена из курса')
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteCategoryMutation = adminKnowledgeApi.adminKnowledge.categories.delete.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch()
      if (selectedCategoryId === editingCategory?.id) {
        setSelectedCategoryId(null)
      }
      setEditingCategory(null)
      setShowGlobalImpactDialog(true)
    },
    onError: () => toast.error('Не удалось удалить категорию'),
  })

  const deleteArticleMutation = adminKnowledgeApi.adminKnowledge.articles.delete.useMutation({
    onSuccess: () => {
      refetchArticles()
      setShowGlobalImpactDialog(true)
    },
    onError: () => toast.error('Не удалось удалить статью'),
  })

  useEffect(() => {
    if (!categoriesQuery.data) {
      setItems([])
      return
    }

    const sorted = [...categoriesQuery.data]
      .sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER
        if (a.linked !== b.linked) {
          return a.linked ? -1 : 1
        }
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a.title.localeCompare(b.title)
      })

    setItems(sorted)

    if (sorted.length === 0) {
      setSelectedCategoryId(null)
      return
    }

    const hasSelected = sorted.some(category => category.id === selectedCategoryId)
    if (!selectedCategoryId || !hasSelected) {
      setSelectedCategoryId(sorted[0].id)
    }
  }, [categoriesQuery.data, selectedCategoryId])

  useEffect(() => {
    if (!articles) {
      setArticleItems([])
      return
    }
    const sorted = [...articles].sort((a, b) => a.order - b.order)
    setArticleItems(sorted)
  }, [articles])

  const handleToggleCategory = (categoryId: string, linked: boolean, order: number | null) => {
    if (linked) {
      unlinkMutation.mutate({ courseId, categoryId })
      return
    }
    const nextOrder =
      Number.isFinite(order) && order !== null
        ? Number(order)
        : items.filter(item => item.linked).length

    linkMutation.mutate({ courseId, categoryId, order: nextOrder })
  }

  const reorderMutation = adminKnowledgeApi.adminKnowledge.categories.reorder.useMutation({
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success('Порядок сохранён')
    },
    onError: () => toast.error('Не удалось сохранить порядок'),
  })

  const handleDragStart = (categoryId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(categoryId)
  }

  const handleDragOver = (overId: string, event: React.DragEvent) => {
    event.preventDefault()
    if (!draggingId || draggingId === overId) return

    const draggingIndex = items.findIndex(item => item.id === draggingId)
    const overIndex = items.findIndex(item => item.id === overId)
    const draggingItem = items[draggingIndex]
    const overItem = items[overIndex]

    if (!draggingItem?.linked || !overItem?.linked) {
      return
    }

    const next = arrayMove(items, draggingIndex, overIndex)
    setItems(applySequentialOrder(next))
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    const linkedItems = items.filter(item => item.linked)
    if (linkedItems.length === 0) {
      return
    }
    const payload = linkedItems.map((item, index) => ({
      categoryId: item.id,
      order: index,
    }))
    reorderMutation.mutate({ courseId, items: payload })
  }

  const reorderArticlesMutation = adminKnowledgeApi.adminKnowledge.articles.reorder.useMutation({
    onSuccess: () => {
      refetchArticles()
      toast.success('Порядок статей сохранён')
    },
    onError: () => toast.error('Не удалось сохранить порядок статей'),
  })

  const handleArticleDragStart = (articleId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    setDraggingArticleId(articleId)
  }

  const handleArticleDragOver = (overId: string, event: React.DragEvent) => {
    event.preventDefault()
    if (draggingArticleId === overId) {
      return
    }

    const fromIndex = articleItems.findIndex(item => item.id === draggingArticleId)
    const toIndex = articleItems.findIndex(item => item.id === overId)
    const isValidMove = fromIndex >= 0 && toIndex >= 0
    if (!isValidMove) {
      return
    }

    const updated = arrayMove(articleItems, fromIndex, toIndex).map((item, index) => ({
      ...item,
      order: index,
    }))
    setArticleItems(updated)
  }

  const handleArticleDragEnd = () => {
    const hasDrag = Boolean(draggingArticleId)
    setDraggingArticleId(null)
    if (!hasDrag || !selectedCategoryId) {
      return
    }
    const payload = articleItems.map((item, index) => ({
      articleId: item.id,
      order: index,
    }))
    reorderArticlesMutation.mutate({ categoryId: selectedCategoryId, items: payload })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Темы для курса</h2>
          <p className="text-sm text-muted-foreground">
            Выберите, какие темы показывать пользователям этого курса. Изменение темы или статьи влияет на все курсы, где она используется.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/admin/knowledge?new=1">Добавить тему</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {categoriesQuery.data?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Тем пока нет. Создайте их на странице &quot;База знаний&quot;.
            </CardContent>
          </Card>
        )}

        {items.map(category => (
          <Card
            key={category.id}
            draggable={category.linked}
            onDragStart={event => handleDragStart(category.id, event)}
            onDragOver={event => handleDragOver(category.id, event)}
            onDragEnd={handleDragEnd}
            className={category.linked ? 'cursor-grab' : ''}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={category.linked}
                  onCheckedChange={() => handleToggleCategory(category.id, category.linked, category.order)}
                />
                <div>
                  <CardTitle className="text-base">{category.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{category.slug}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Статей: {category._count?.articles ?? 0}</Badge>
                    <Badge variant="secondary">
                      Порядок: {category.order ?? 0}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCategoryId(category.id)}
                  title="Открыть список статей"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingCategory(category)
                  }}
                  title="Редактировать тему"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const confirmed = confirm('Удалить тему? Изменения затронут все курсы, где она используется.')
                    if (confirmed) {
                      if (selectedCategoryId === category.id) {
                        setSelectedCategoryId(null)
                      }
                      deleteCategoryMutation.mutate({ id: category.id })
                    }
                  }}
                  title="Удалить тему"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
                {selectedCategoryId === category.id && (
                  <CardContent className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Статьи</h4>
                      <Button size="sm" variant="secondary" onClick={() => {
                        setCreatingArticle(true)
                      }}>
                        <Plus className="mr-2 h-3 w-3" />
                        Добавить статью
                      </Button>
                    </div>
                {articleItems.length === 0 && (
                  <div className="text-sm text-muted-foreground">Нет статей</div>
                )}
                {articleItems.map(article => (
                  <div
                    key={article.id}
                    draggable
                    onDragStart={event => handleArticleDragStart(article.id, event)}
                    onDragOver={event => handleArticleDragOver(article.id, event)}
                    onDragEnd={handleArticleDragEnd}
                    className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm cursor-grab"
                  >
                    <span>{article.title}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingArticle(article)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const confirmed = confirm('Удалить статью? Изменения затронут все курсы, где эта тема подключена.')
                          if (confirmed) {
                            deleteArticleMutation.mutate({ id: article.id })
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <CategoryForm
        open={Boolean(editingCategory)}
        onOpenChange={open => {
          if (!open) {
            setEditingCategory(null)
          }
        }}
        courseId={courseId}
        category={editingCategory}
        linked={editingCategory?.linked}
        onSuccess={() => {
          categoriesQuery.refetch()
          setEditingCategory(null)
          setShowGlobalImpactDialog(true)
        }}
      />

      {selectedCategoryId && (
        <ArticleForm
          open={creatingArticle || Boolean(editingArticle)}
          onOpenChange={open => {
            if (!open) {
              setCreatingArticle(false)
              setEditingArticle(null)
            }
          }}
          categoryId={selectedCategoryId}
          article={editingArticle}
          onSuccess={() => {
            setCreatingArticle(false)
            setEditingArticle(null)
            refetchArticles()
            setShowGlobalImpactDialog(true)
          }}
        />
      )}

      <Dialog open={showGlobalImpactDialog} onOpenChange={setShowGlobalImpactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменения базы знаний</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Изменения тем и статей применяются ко всем курсам, где эти темы подключены. Проверьте другие курсы при необходимости.
          </p>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowGlobalImpactDialog(false)}>Понятно</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
