'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { adminRecipesApi } from './_api'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Badge } from '@/shared/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Separator } from '@/shared/ui/separator'
import { RecipeForm } from './_ui/recipe-form'

export function AdminRecipesPage() {
  const [openForm, setOpenForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openDelete, setOpenDelete] = useState(false)

  const listQuery = adminRecipesApi.adminRecipes.list.useQuery()
  const deleteMutation = adminRecipesApi.adminRecipes.delete.useMutation({
    onSuccess: () => {
      toast.success('Рецепт удален')
      setOpenDelete(false)
      setSelectedId(null)
      listQuery.refetch()
    },
    onError: err => toast.error(err.message),
  })

  const selectedRecipe = listQuery.data?.find(item => item.id === selectedId)

  const openCreate = () => {
    setSelectedId(null)
    setOpenForm(true)
  }

  const openEdit = (id: string) => {
    setSelectedId(id)
    setOpenForm(true)
  }

  const handleDelete = () => {
    if (!selectedId) {
      return
    }
    deleteMutation.mutate({ id: selectedId })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Рецепты</h1>
          <p className="text-muted-foreground">
            Управляйте рецептами: создавайте, редактируйте, загружайте фото.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить рецепт
        </Button>
      </div>

      {listQuery.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Loader2 className="mr-2 inline h-5 w-5 animate-spin" />
            Загрузка рецептов...
          </CardContent>
        </Card>
      ) : listQuery.data && listQuery.data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Рецептов пока нет. Создайте первый.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список рецептов</CardTitle>
            <CardDescription>
              Всего: {listQuery.data?.length ?? 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Прием пищи</TableHead>
                    <TableHead>Диеты</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead>Ккал</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listQuery.data?.map(recipe => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">
                        {recipe.title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {recipe.slug}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {recipe.mealCategories.map(item => (
                          <Badge key={item} variant="secondary">
                            {mealCategoryLabel[item] ?? item}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="space-x-1">
                        {recipe.diets.map(item => (
                          <Badge key={item} variant="outline">
                            {dietLabel[item] ?? item}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {recipe.preparationTimeMinutes} мин
                      </TableCell>
                      <TableCell className="text-sm">
                        {recipe.calories ?? '—'}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(recipe.id)}
                          aria-label={`Редактировать ${recipe.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedId(recipe.id)
                            setOpenDelete(true)
                          }}
                          aria-label={`Удалить ${recipe.title}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <RecipeForm
        open={openForm}
        onOpenChange={setOpenForm}
        recipe={selectedRecipe}
        onSuccess={() => {
          setOpenForm(false)
          toast.success('Сохранено')
          listQuery.refetch()
        }}
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить рецепт?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Это действие нельзя отменить. Рецепт будет удален безвозвратно.
            </p>
            <Separator />
            <p className="font-medium">{selectedRecipe?.title}</p>
          </div>
          <DialogFooter className="justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpenDelete(false)}
              disabled={deleteMutation.isPending}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const mealCategoryLabel: Record<string, string> = {
  BREAKFAST: 'Завтрак',
  LUNCH: 'Обед',
  DINNER: 'Ужин',
  SNACK: 'Перекус',
  SALAD: 'Салат',
  DESSERT: 'Десерт',
  SOUP: 'Суп',
}

const dietLabel: Record<string, string> = {
  VEGETARIAN: 'Вегетарианское',
  HIGH_PROTEIN: 'Белковое',
  LOW_CARB: 'Низкоуглеводное',
  GLUTEN_FREE: 'Безглютеновое',
  VEGAN: 'Веганское',
  LOW_CALORIE: 'Низкокалорийное',
  LACTOSE_FREE: 'Безлактозное',
  SUGAR_FREE: 'Без сахара',
}
