'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Separator } from '@/shared/ui/separator'
import { AppImage } from '@/shared/ui/app-image'
import { Clock, Flame, ChefHat, Minus, Plus, Heart } from 'lucide-react'
import { userRecipesApi } from '../_api'
import { toast } from 'sonner'
import { BackButton } from '@/shared/ui/back-button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

type RecipeDetailProps = {
  slug: string
}

export function RecipeDetail({ slug }: Readonly<RecipeDetailProps>) {
  const router = useRouter()
  const detailQuery = userRecipesApi.recipes.getBySlug.useQuery({ slug })

  const toggleFavorite = userRecipesApi.recipes.toggleFavorite.useMutation({
    onSuccess: res => {
      toast.success(
        res.favorite ? 'Добавлено в избранное' : 'Удалено из избранного'
      )
      detailQuery.refetch()
    },
    onError: err => toast.error(err.message),
  })

  const [servingsOpen, setServingsOpen] = useState(false)

  const recipe = detailQuery.data
  const [servings, setServings] = useState(() => recipe?.servings ?? 1)
  const baseServings = recipe?.servings ?? 1

  const factor = useMemo(() => {
    if (!baseServings) return 1
    return servings / baseServings
  }, [servings, baseServings])

  const adjustValue = (value?: number | null) => {
    if (value === null || value === undefined) return undefined
    return Math.round(value * factor * 100) / 100
  }

  if (detailQuery.isLoading) {
    return (
      <div className="relative">
        <div className="fixed inset-x-0 top-0 z-0 px-3 sm:top-14 sm:px-6">
          <div className="relative mx-auto h-88 w-full max-w-xl overflow-hidden bg-muted sm:h-104">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
        </div>

        <div className="relative z-10 pt-80 sm:pt-96">
          <div className="mx-auto w-full max-w-xl rounded-t-4xl bg-background px-4 pb-8 pt-6 shadow-[0_-12px_32px_rgba(0,0,0,0.08)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-7 w-40" />
              <div className="space-y-2 rounded-md border p-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-4"
                  >
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-7 w-44" />
              <div className="space-y-3 rounded-md border p-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (detailQuery.error || !recipe) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {detailQuery.error?.message ?? 'Рецепт не найден'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      <div className="fixed inset-x-0 top-0 z-0 px-3 sm:top-14 sm:px-6">
        <div className="relative mx-auto h-88 w-full max-w-xl overflow-hidden bg-muted sm:h-104">
          {recipe.imageUrl ? (
            <AppImage
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-b from-black/35 via-black/10 to-black/45" />
        </div>
      </div>

      <div className="fixed inset-x-0 top-0 z-30 px-3 sm:top-14 sm:px-6">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-4">
          <BackButton
            onClick={() => router.back()}
            className="border-white/20 bg-background/85 shadow-sm backdrop-blur"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Переключить избранное"
            onClick={() => toggleFavorite.mutate({ recipeId: recipe.id })}
            className="border-white/20 bg-background/85 shadow-sm backdrop-blur"
          >
            {recipe.isFavorite ? (
              <Heart className="h-5 w-5 fill-red-500 text-red-500" />
            ) : (
              <Heart className="h-5 w-5 text-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative z-10 pt-80 sm:pt-96">
        <div className="mx-auto w-full max-w-xl rounded-t-4xl bg-background px-4 pb-8 pt-6 shadow-[0_-12px_32px_rgba(0,0,0,0.08)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{recipe.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {recipe.preparationTimeMinutes} мин
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  {recipe.calories ?? '—'} ккал
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <ChefHat className="h-4 w-4" />
                  {difficultyLabel(recipe.cookingDifficulty)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipe.mealCategories.map(tag => (
                <Badge key={tag} variant="secondary">
                  {mealLabel(tag)}
                </Badge>
              ))}
              {recipe.diets.map(tag => (
                <Badge key={tag} variant="outline">
                  {dietLabel(tag)}
                </Badge>
              ))}
              {recipe.ingredientTags.map(tag => (
                <Badge key={tag} variant="outline">
                  {ingredientLabel(tag)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ингредиенты</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setServingsOpen(true)}
                className="gap-2"
              >
                Порций: {servings}
              </Button>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              {recipe.ingredients.map(item => (
                <div
                  key={item.id}
                  className="flex items-start justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatQuantity(adjustValue(item.quantity)) ??
                      formatQuantity(adjustValue(item.weightGrams)) ??
                      '—'}
                  </span>
                  <span className="text-foreground text-right">
                    {item.name}
                    {item.description ? ` (${item.description})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">Приготовление</h2>
            <div className="space-y-3 rounded-md border p-3">
              {recipe.steps.map(step => (
                <div key={step.id} className="space-y-1">
                  <p className="text-sm font-semibold">Шаг {step.stepNumber}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {step.instruction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={servingsOpen} onOpenChange={setServingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Количество порций</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(prev => Math.max(1, prev - 1))}
              disabled={servings <= 1}
              aria-label="Уменьшить порции"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-semibold w-12 text-center">
              {servings}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(prev => Math.min(10, prev + 1))}
              disabled={servings >= 10}
              aria-label="Увеличить порции"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setServingsOpen(false)}>Готово</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function difficultyLabel(value: string) {
  const map: Record<string, string> = {
    EASY: 'Просто',
    MEDIUM: 'Средне',
    HARD: 'Сложно',
  }
  return map[value] ?? value
}

function mealLabel(value: string) {
  const map: Record<string, string> = {
    BREAKFAST: 'Завтрак',
    LUNCH: 'Обед',
    DINNER: 'Ужин',
    SNACK: 'Перекус',
    SALAD: 'Салат',
    SOUP: 'Суп',
    DESSERT: 'Десерт',
  }
  return map[value] ?? value
}

function dietLabel(value: string) {
  const map: Record<string, string> = {
    VEGETARIAN: 'Вегетарианское',
    HIGH_PROTEIN: 'Белковое',
    LOW_CARB: 'Низкоуглеводное',
    GLUTEN_FREE: 'Безглютеновое',
    VEGAN: 'Веганское',
    LOW_CALORIE: 'Низкокалорийное',
    LACTOSE_FREE: 'Безлактозное',
    SUGAR_FREE: 'Без сахара',
  }
  return map[value] ?? value
}

function ingredientLabel(value: string) {
  const map: Record<string, string> = {
    FISH: 'Рыба',
    SEAFOOD: 'Морепродукты',
    NUTS: 'Орехи',
    EGGS: 'Яйца',
    DAIRY: 'Молочное',
    PORK: 'Свинина',
    BEEF: 'Говядина',
    BREAD: 'Хлеб',
    PASTA: 'Макароны',
    RICE: 'Рис',
    POTATO: 'Картофель',
    AVOCADO: 'Авокадо',
    SALMON: 'Лосось',
    BACON: 'Бекон',
    SPINACH: 'Шпинат',
  }
  return map[value] ?? value
}

function formatQuantity(value?: number) {
  if (value === undefined) return null
  return value % 1 === 0 ? value.toString() : value.toFixed(2)
}
