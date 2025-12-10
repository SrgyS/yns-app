'use client'

import { useState, useEffect } from 'react'
import { adminKnowledgeApi } from '../_api'
import { Button } from '@/shared/ui/button'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { CategoryForm } from './category-form'
import { ArticleForm } from './article-form'

export function KnowledgeCategoriesList({ courseId }: { courseId: string }) {
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingArticle, setEditingArticle] = useState<any>(null)
  const [creatingArticle, setCreatingArticle] = useState(false)

  const { data: categories, refetch } = adminKnowledgeApi.adminKnowledge.categories.list.useQuery({
    courseId,
  })

  const { data: articles, refetch: refetchArticles } = adminKnowledgeApi.adminKnowledge.articles.list.useQuery(
    selectedCategoryId ? { categoryId: selectedCategoryId } : { categoryId: '' },
    { enabled: !!selectedCategoryId }
  )

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

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
                    {articles?.length === 0 && <div className="text-sm text-muted-foreground">Нет статей</div>}
                    {articles?.map(article => (
                      <div key={article.id} className="flex items-center justify-between rounded bg-muted/50 p-2 text-sm">
                         <span>{article.title}</span>
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
