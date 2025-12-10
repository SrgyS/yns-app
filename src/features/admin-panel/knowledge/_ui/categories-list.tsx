'use client'

import { useState, useEffect } from 'react'
import { skipToken } from '@tanstack/react-query'
import { adminKnowledgeApi } from '../_api'
import { Button } from '@/shared/ui/button'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { CategoryForm } from './category-form'
import { ArticleForm } from './article-form'

export function KnowledgeCategoriesList({
  courseId,
  autoOpenCreate,
}: {
  courseId?: string
  autoOpenCreate?: boolean
}) {
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [createRequested, setCreateRequested] = useState(false)
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [creatingArticle, setCreatingArticle] = useState(false)
  const [articlesState, setArticlesState] = useState<any[]>([])
  const [draggingArticleId, setDraggingArticleId] = useState<string | null>(null)

  const { data: globalCategories, refetch: refetchGlobal } = adminKnowledgeApi.adminKnowledge.categories.listGlobal.useQuery(
    undefined,
    { enabled: !courseId }
  )

  const { data: courseCategories, refetch: refetchCourse } = adminKnowledgeApi.adminKnowledge.categories.list.useQuery(
    courseId ? { courseId } : skipToken
  )

  const categories = courseId ? courseCategories : globalCategories
  const refetch = courseId ? refetchCourse : refetchGlobal

  const { data: articles, refetch: refetchArticles } = adminKnowledgeApi.adminKnowledge.articles.list.useQuery(
    selectedCategoryId ? { categoryId: selectedCategoryId } : skipToken
  )

  useEffect(() => {
    if (!articles) {
      setArticlesState([])
      return
    }
    const sorted = [...articles].sort((a, b) => a.order - b.order)
    setArticlesState(sorted)
  }, [articles])

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    if (autoOpenCreate && !createRequested) {
      setCreateRequested(true)
      setCreatingCategory(true)
    }
  }, [autoOpenCreate, createRequested])

  const deleteCategoryMutation = adminKnowledgeApi.adminKnowledge.categories.delete.useMutation({
    onSuccess: () => {
      refetch()
      if (selectedCategoryId === editingCategory?.id) {
        setSelectedCategoryId(null)
      }
    },
  })

  const deleteArticleMutation = adminKnowledgeApi.adminKnowledge.articles.delete.useMutation({
    onSuccess: () => refetchArticles(),
  })

  const reorderArticlesMutation = adminKnowledgeApi.adminKnowledge.articles.reorder.useMutation({
    onSuccess: () => {
      refetchArticles()
    },
  })

  const handleArticleDragStart = (articleId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    setDraggingArticleId(articleId)
  }

  const handleArticleDragOver = (overId: string, event: React.DragEvent) => {
    event.preventDefault()
    if (!draggingArticleId || draggingArticleId === overId) {
      return
    }

    const fromIndex = articlesState.findIndex(item => item.id === draggingArticleId)
    const toIndex = articlesState.findIndex(item => item.id === overId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const updated = [...articlesState]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)

    setArticlesState(
      updated.map((item, index) => ({
        ...item,
        order: index,
      }))
    )
  }

  const handleArticleDragEnd = () => {
    setDraggingArticleId(null)
    if (!selectedCategoryId) {
      return
    }

    const payload = articlesState.map((item, index) => ({
      articleId: item.id,
      order: index,
    }))

    reorderArticlesMutation.mutate({ categoryId: selectedCategoryId, items: payload })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Категории (Темы)</h2>
        <Button size="sm" onClick={() => setCreatingCategory(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить тему
        </Button>
      </div>

      <div className="space-y-4">
        {categories?.length === 0 && (
          <div className="text-sm text-muted-foreground">Нет категорий</div>
        )}
        
        {categories?.map(category => (
          <div key={category.id} className="rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setSelectedCategoryId(category.id)}>
                   <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Удалить категорию? Это действие нельзя отменить.')) {
                    deleteCategoryMutation.mutate({ id: category.id })
                  }
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedCategoryId === category.id && (
              <div className="mt-4 border-t pt-4 pl-4">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-sm font-semibold">Статьи</h4>
                   <Button size="sm" variant="secondary" onClick={() => setCreatingArticle(true)}>
                     <Plus className="mr-2 h-3 w-3" />
                     Добавить статью
                   </Button>
                </div>
                 
                 <div className="space-y-2">
                    {articlesState.length === 0 && <div className="text-sm text-muted-foreground">Нет статей</div>}
                    {articlesState.map(article => (
                      <div
                        key={article.id}
                        draggable
                        onDragStart={event => handleArticleDragStart(article.id, event)}
                        onDragOver={event => handleArticleDragOver(article.id, event)}
                        onDragEnd={handleArticleDragEnd}
                        className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm cursor-grab"
                      >
                         <div className="flex items-center gap-2">
                           <span>{article.title}</span>
                         </div>
                         <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingArticle(article)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              if (confirm('Удалить статью?')) {
                                deleteArticleMutation.mutate({ id: article.id })
                              }
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                         </div>
                      </div>
                    ))}
                 </div>
             </div>
           )}
          </div>
        ))}
      </div>

      <CategoryForm
        open={creatingCategory || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setCreatingCategory(false)
            setEditingCategory(null)
          }
        }}
        courseId={courseId}
        linked={Boolean(courseId)}
        category={editingCategory}
        onSuccess={() => {
            setCreatingCategory(false)
            setEditingCategory(null)
            refetch()
        }}
      />

      {selectedCategoryId && (
        <ArticleForm
          open={creatingArticle || !!editingArticle}
          onOpenChange={(open) => {
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
          }}
        />
      )}
    </div>
  )
}
