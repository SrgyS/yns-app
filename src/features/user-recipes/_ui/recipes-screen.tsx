'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Flame, Filter, Heart } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/shared/ui/sheet'
import { Switch } from '@/shared/ui/switch'
import { SmallSpinner } from '@/shared/ui/small-spinner'
import { AppImage } from '@/shared/ui/app-image'
import { userRecipesApi } from '../_api'
import { toast } from 'sonner'

type FilterState = {
  mealCategories: string[]
  diets: string[]
  difficulty: string[]
  ingredientTags: string[]
  fast: boolean
  onlyFavorites: boolean
}


const defaultFilters: FilterState = {
  mealCategories: [],
  diets: [],
  difficulty: [],
  ingredientTags: [],
  fast: false,
  onlyFavorites: false,
}

const typeFilters = [
  { label: 'Завтрак', meal: 'BREAKFAST' as const },
  { label: 'Обед', meal: 'LUNCH' as const },
  { label: 'Ужин', meal: 'DINNER' as const },
  { label: 'Без сахара', diet: 'SUGAR_FREE' as const },
  { label: 'Низкокалорийное', diet: 'LOW_CALORIE' as const },
  { label: 'Перекус', meal: 'SNACK' as const },
  { label: 'Салат', meal: 'SALAD' as const },
  { label: 'Суп', meal: 'SOUP' as const },
  { label: 'Вегетарианское', diet: 'VEGETARIAN' as const },
] satisfies Array<
  | { label: string; meal: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'SALAD' | 'SOUP' }
  | { label: string; diet: 'SUGAR_FREE' | 'LOW_CALORIE' | 'VEGETARIAN' }
>

const mealOptions = [
  { value: 'BREAKFAST', label: 'Завтрак' },
  { value: 'LUNCH', label: 'Обед' },
  { value: 'DINNER', label: 'Ужин' },
  { value: 'SNACK', label: 'Перекус' },
  { value: 'SALAD', label: 'Салат' },
  { value: 'SOUP', label: 'Суп' },
] as const

const dietOptions = [
  { value: 'VEGETARIAN', label: 'Вегетарианское' },
  { value: 'HIGH_PROTEIN', label: 'Белковое' },
  { value: 'LOW_CARB', label: 'Низкоуглеводное' },
  { value: 'GLUTEN_FREE', label: 'Безглютеновое' },
  { value: 'VEGAN', label: 'Веганское' },
  { value: 'LOW_CALORIE', label: 'Низкокалорийное' },
  { value: 'LACTOSE_FREE', label: 'Безлактозное' },
  { value: 'SUGAR_FREE', label: 'Без сахара' },
] as const

const cookingOptions = [
  { value: 'EASY', label: 'Просто' },
  { value: 'MEDIUM', label: 'Средне' },
  { value: 'HARD', label: 'Сложно' },
] as const

const ingredientOptions = [
  { value: 'FISH', label: 'Рыба' },
  { value: 'SEAFOOD', label: 'Морепродукты' },
  { value: 'NUTS', label: 'Орехи' },
  { value: 'EGGS', label: 'Яйца' },
  { value: 'DAIRY', label: 'Молочное' },
  { value: 'PORK', label: 'Свинина' },
  { value: 'BEEF', label: 'Говядина' },
  { value: 'BREAD', label: 'Хлеб' },
  { value: 'PASTA', label: 'Макароны' },
  { value: 'RICE', label: 'Рис' },
  { value: 'POTATO', label: 'Картофель' },
  { value: 'AVOCADO', label: 'Авокадо' },
  { value: 'SALMON', label: 'Лосось' },
  { value: 'BACON', label: 'Бекон' },
  { value: 'SPINACH', label: 'Шпинат' },
] as const

export function RecipesScreen() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [filterOpen, setFilterOpen] = useState(false)

  const listQuery = userRecipesApi.recipes.list.useQuery({
    mealCategories: filters.mealCategories as any,
    diets: filters.diets as any,
    difficulty: filters.difficulty as any,
    ingredientTags: filters.ingredientTags as any,
    fast: filters.fast,
    onlyFavorites: filters.onlyFavorites,
  })

  const toggleFavorite = userRecipesApi.recipes.toggleFavorite.useMutation({
    onError: err => toast.error(err.message),
    onSuccess: res => {
      toast.success(res.favorite ? 'Добавлено в избранное' : 'Удалено из избранного')
      listQuery.refetch()
    },
  })

  const applyQuickType = (type: (typeof typeFilters)[number]) => {
    setFilters(prev => ({
      ...prev,
      mealCategories: type.meal ? [type.meal] : prev.mealCategories,
      diets: type.diet ? [type.diet] : prev.diets,
    }))
  }

  const recipes = listQuery.data ?? []
  const isEmpty = !listQuery.isLoading && recipes.length === 0

  return (
    <section className="py-4 space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold leading-tight">Рецепты</h1>

          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Фильтр
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader className="flex flex-row items-center justify-between">
                <SheetTitle>Фильтры</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(defaultFilters)}
                >
                  Сброс
                </Button>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <FilterGroup
                  title="Приём пищи"
                  options={mealOptions}
                  values={filters.mealCategories}
                  onToggle={value =>
                    setFilters(prev => ({
                      ...prev,
                      mealCategories: toggleItem(prev.mealCategories, value),
                    }))
                  }
                />
                <FilterGroup
                  title="Диета"
                  options={dietOptions}
                  values={filters.diets}
                  onToggle={value =>
                    setFilters(prev => ({
                      ...prev,
                      diets: toggleItem(prev.diets, value),
                    }))
                  }
                />
                <FilterGroup
                  title="Сложность"
                  options={cookingOptions}
                  values={filters.difficulty}
                  onToggle={value =>
                    setFilters(prev => ({
                      ...prev,
                      difficulty: toggleItem(prev.difficulty, value),
                    }))
                  }
                />
                <FilterGroup
                  title="Ингредиенты"
                  options={ingredientOptions}
                  values={filters.ingredientTags}
                  onToggle={value =>
                    setFilters(prev => ({
                      ...prev,
                      ingredientTags: toggleItem(prev.ingredientTags, value),
                    }))
                  }
                  columns="grid-cols-2 sm:grid-cols-3"
                />
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Быстро</p>
                    <p className="text-xs text-muted-foreground">
                      Время приготовления до 20 минут
                    </p>
                  </div>
                  <Switch
                    checked={filters.fast}
                    onCheckedChange={checked =>
                      setFilters(prev => ({ ...prev, fast: Boolean(checked) }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Только избранные</p>
                    <p className="text-xs text-muted-foreground">
                      Показывать только любимые рецепты
                    </p>
                  </div>
                  <Switch
                    checked={filters.onlyFavorites}
                    onCheckedChange={checked =>
                      setFilters(prev => ({
                        ...prev,
                        onlyFavorites: Boolean(checked),
                      }))
                    }
                  />
                </div>
              </div>
              <SheetFooter>
                <Button className="w-full" onClick={() => setFilterOpen(false)}>
                  Применить
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {typeFilters.map(item => (
          <Button
            key={item.label}
            variant="secondary"
            size="sm"
            onClick={() => applyQuickType(item)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {renderRecipesState({ listQuery, isEmpty, recipes, toggleFavorite })}
    </section>
  )
}

function renderRecipesState({
  listQuery,
  isEmpty,
  recipes,
  toggleFavorite,
}: {
  listQuery: ReturnType<typeof userRecipesApi.recipes.list.useQuery>
  isEmpty: boolean
  recipes: any[]
  toggleFavorite: ReturnType<typeof userRecipesApi.recipes.toggleFavorite.useMutation>
}) {
  if (listQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <SmallSpinner isLoading />
        <span>Загрузка рецептов...</span>
      </div>
    )
  }

  if (listQuery.error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {listQuery.error.message || 'Ошибка загрузки рецептов'}
        </CardContent>
      </Card>
    )
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Ничего не найдено. Попробуйте изменить фильтры.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {recipes.map((recipe: any) => (
        <Card
          key={recipe.id}
          className="overflow-hidden border-border/80 transition hover:shadow-lg py-0 gap-2"
        >
          <div className="relative h-32 w-full bg-muted md:h-40">
            {recipe.imageUrl ? (
              <AppImage
                src={recipe.imageUrl}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            ) : null}
            <button
              className="absolute right-2 top-2 rounded-full bg-background/80 p-2 shadow-sm transition hover:scale-105"
              onClick={() => toggleFavorite.mutate({ recipeId: recipe.id })}
              aria-label="Переключить избранное"
            >
              {recipe.isFavorite ? (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              ) : (
                <Heart className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <CardHeader className="space-y-1 px-3">
            <CardTitle className="line-clamp-2 wrap-break-word text-base leading-snug md:text-lg">
              {recipe.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
              <Clock className="h-4 w-4" />
              <span>{recipe.preparationTimeMinutes} мин</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
              <Flame className="h-4 w-4" />
              <span>{recipe.calories ?? '—'} ккал</span>
            </div>
            <Button asChild variant="link" className="h-auto px-0 text-primary">
              <Link href={`/platform/recipes/${recipe.slug}`}>Подробнее</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function FilterGroup({
  title,
  options,
  values,
  onToggle,
  columns,
}: Readonly<{
  title: string
  options: ReadonlyArray<{ value: string; label: string }>
  values: string[]
  onToggle: (value: string) => void
  columns?: string
}>) {
  const gridClass = columns ?? 'grid-cols-2 sm:grid-cols-3'
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className={`grid gap-2 ${gridClass}`}>
        {options.map(option => {
          const active = values.includes(option.value)
          return (
            <Button
              key={option.value}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggle(option.value)}
              className="justify-start"
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function toggleItem(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}
