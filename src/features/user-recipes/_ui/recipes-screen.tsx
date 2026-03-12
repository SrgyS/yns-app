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
import { AppImage } from '@/shared/ui/app-image'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
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

type MealQuickFilter = {
  label: string
  meal: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'SALAD' | 'SOUP'
}

type DietQuickFilter = {
  label: string
  diet: 'SUGAR_FREE' | 'LOW_CALORIE' | 'VEGETARIAN'
}

type QuickTypeFilter = MealQuickFilter | DietQuickFilter

type RecipesListQuery = ReturnType<typeof userRecipesApi.recipes.list.useQuery>
type ToggleFavoriteMutation = ReturnType<
  typeof userRecipesApi.recipes.toggleFavorite.useMutation
>
type RecipeListItem = {
  id: string
  slug: string
  title: string
  imageUrl: string | null
  isFavorite: boolean
  preparationTimeMinutes: number
  calories: number | null
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
] satisfies QuickTypeFilter[]

function isMealQuickFilter(type: QuickTypeFilter): type is MealQuickFilter {
  return 'meal' in type
}

function updateListFilter(
  filters: FilterState,
  key: 'mealCategories' | 'diets' | 'difficulty' | 'ingredientTags',
  value: string
) {
  return {
    ...filters,
    [key]: toggleItem(filters[key], value),
  }
}

function updateBooleanFilter(
  filters: FilterState,
  key: 'fast' | 'onlyFavorites',
  checked: boolean
) {
  return {
    ...filters,
    [key]: checked,
  }
}

function applyQuickTypeFilter(filters: FilterState, type: QuickTypeFilter) {
  if (isMealQuickFilter(type)) {
    return updateListFilter(filters, 'mealCategories', type.meal)
  }

  return updateListFilter(filters, 'diets', type.diet)
}

function isQuickTypeSelected(filters: FilterState, type: QuickTypeFilter) {
  if (isMealQuickFilter(type)) {
    return filters.mealCategories.includes(type.meal)
  }

  return filters.diets.includes(type.diet)
}

function removeQuickFilters(filters: FilterState) {
  return {
    ...filters,
    mealCategories: filters.mealCategories.filter(isNotQuickMealFilter),
    diets: filters.diets.filter(isNotQuickDietFilter),
  }
}

function isNotQuickMealFilter(meal: string) {
  return !typeFilters.some(
    item => isMealQuickFilter(item) && item.meal === meal
  )
}

function isNotQuickDietFilter(diet: string) {
  return !typeFilters.some(
    item => !isMealQuickFilter(item) && item.diet === diet
  )
}

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
      toast.success(
        res.favorite ? 'Добавлено в избранное' : 'Удалено из избранного'
      )
      listQuery.refetch()
    },
  })

  const handleResetFilters = () => setFilters(defaultFilters)
  const handleToggleMealCategory = (value: string) =>
    setFilters(prev => updateListFilter(prev, 'mealCategories', value))
  const handleToggleDiet = (value: string) =>
    setFilters(prev => updateListFilter(prev, 'diets', value))
  const handleToggleDifficulty = (value: string) =>
    setFilters(prev => updateListFilter(prev, 'difficulty', value))
  const handleToggleIngredientTag = (value: string) =>
    setFilters(prev => updateListFilter(prev, 'ingredientTags', value))
  const handleFastChange = (checked: boolean) =>
    setFilters(prev => updateBooleanFilter(prev, 'fast', Boolean(checked)))
  const handleOnlyFavoritesChange = (checked: boolean) =>
    setFilters(prev =>
      updateBooleanFilter(prev, 'onlyFavorites', Boolean(checked))
    )
  const handleApplyQuickType = (type: QuickTypeFilter) =>
    setFilters(prev => applyQuickTypeFilter(prev, type))
  const isQuickTypeActive = (type: QuickTypeFilter) =>
    isQuickTypeSelected(filters, type)

  const hasActiveQuickFilters = typeFilters.some(isQuickTypeActive)

  const handleResetQuickFilters = () => setFilters(removeQuickFilters)

  const recipes = listQuery.data ?? []
  const isEmpty = !listQuery.isLoading && recipes.length === 0

  return (
    <section className="py-4 space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold leading-tight">Рецепты</h1>

          <FiltersSheet
            filterOpen={filterOpen}
            filters={filters}
            onOpenChange={setFilterOpen}
            onReset={handleResetFilters}
            onToggleMealCategory={handleToggleMealCategory}
            onToggleDiet={handleToggleDiet}
            onToggleDifficulty={handleToggleDifficulty}
            onToggleIngredientTag={handleToggleIngredientTag}
            onFastChange={handleFastChange}
            onOnlyFavoritesChange={handleOnlyFavoritesChange}
          />
        </div>
      </header>

      <QuickFiltersBar
        hasActiveQuickFilters={hasActiveQuickFilters}
        isQuickTypeActive={isQuickTypeActive}
        onApplyQuickType={handleApplyQuickType}
        onResetQuickFilters={handleResetQuickFilters}
      />

      <RecipesState
        isEmpty={isEmpty}
        listQuery={listQuery}
        recipes={recipes}
        toggleFavorite={toggleFavorite}
      />
    </section>
  )
}

function FiltersSheet({
  filterOpen,
  filters,
  onOpenChange,
  onReset,
  onToggleMealCategory,
  onToggleDiet,
  onToggleDifficulty,
  onToggleIngredientTag,
  onFastChange,
  onOnlyFavoritesChange,
}: Readonly<{
  filterOpen: boolean
  filters: FilterState
  onOpenChange: (open: boolean) => void
  onReset: () => void
  onToggleMealCategory: (value: string) => void
  onToggleDiet: (value: string) => void
  onToggleDifficulty: (value: string) => void
  onToggleIngredientTag: (value: string) => void
  onFastChange: (checked: boolean) => void
  onOnlyFavoritesChange: (checked: boolean) => void
}>) {
  const handleApply = () => onOpenChange(false)

  return (
    <Sheet open={filterOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Фильтр
        </Button>
      </SheetTrigger>
      <SheetContent
        side="top"
        className="container md:max-w-150 max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Фильтры</SheetTitle>
          <Button variant="secondary" size="sm" onClick={onReset}>
            Сброс
          </Button>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <FilterGroup
            title="Приём пищи"
            options={mealOptions}
            values={filters.mealCategories}
            onToggle={onToggleMealCategory}
          />
          <FilterGroup
            title="Диета"
            options={dietOptions}
            values={filters.diets}
            onToggle={onToggleDiet}
          />
          <FilterGroup
            title="Сложность"
            options={cookingOptions}
            values={filters.difficulty}
            onToggle={onToggleDifficulty}
          />
          <FilterGroup
            title="Ингредиенты"
            options={ingredientOptions}
            values={filters.ingredientTags}
            onToggle={onToggleIngredientTag}
          />
          <FilterSwitchRow
            checked={filters.fast}
            description="Время приготовления до 20 минут"
            title="Быстро"
            onCheckedChange={onFastChange}
          />
          <FilterSwitchRow
            checked={filters.onlyFavorites}
            description="Показывать только любимые рецепты"
            title="Только избранные"
            onCheckedChange={onOnlyFavoritesChange}
          />
        </div>
        <SheetFooter>
          <Button className="w-full" onClick={handleApply}>
            Применить
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function QuickFiltersBar({
  hasActiveQuickFilters,
  isQuickTypeActive,
  onApplyQuickType,
  onResetQuickFilters,
}: Readonly<{
  hasActiveQuickFilters: boolean
  isQuickTypeActive: (type: QuickTypeFilter) => boolean
  onApplyQuickType: (type: QuickTypeFilter) => void
  onResetQuickFilters: () => void
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {typeFilters.map(item => (
        <QuickFilterButton
          key={item.label}
          filter={item}
          isActive={isQuickTypeActive(item)}
          onClick={onApplyQuickType}
        />
      ))}
      {hasActiveQuickFilters ? (
        <Button variant="outline" size="sm" onClick={onResetQuickFilters}>
          Сбросить
        </Button>
      ) : null}
    </div>
  )
}

function QuickFilterButton({
  filter,
  isActive,
  onClick,
}: Readonly<{
  filter: QuickTypeFilter
  isActive: boolean
  onClick: (type: QuickTypeFilter) => void
}>) {
  const handleClick = () => onClick(filter)

  return (
    <Button
      variant={isActive ? 'default' : 'secondary'}
      size="sm"
      onClick={handleClick}
      className={isActive ? 'shadow-sm' : undefined}
    >
      {filter.label}
    </Button>
  )
}

function RecipesState({
  listQuery,
  isEmpty,
  recipes,
  toggleFavorite,
}: Readonly<{
  listQuery: RecipesListQuery
  isEmpty: boolean
  recipes: RecipeListItem[]
  toggleFavorite: ToggleFavoriteMutation
}>) {
  if (listQuery.isLoading) {
    return <RecipesLoadingState />
  }

  if (listQuery.error) {
    return <RecipesErrorState message={listQuery.error.message} />
  }

  if (isEmpty) {
    return <RecipesEmptyState />
  }

  return <RecipesGrid recipes={recipes} toggleFavorite={toggleFavorite} />
}

function RecipesLoadingState() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-border/80 bg-card"
        >
          <Skeleton className="h-32 w-full rounded-none md:h-40" />
          <div className="space-y-3 p-3">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function RecipesErrorState({ message }: Readonly<{ message?: string }>) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-destructive">
        {message || 'Ошибка загрузки рецептов'}
      </CardContent>
    </Card>
  )
}

function RecipesEmptyState() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        Ничего не найдено. Попробуйте изменить фильтры.
      </CardContent>
    </Card>
  )
}

function RecipesGrid({
  recipes,
  toggleFavorite,
}: Readonly<{
  recipes: RecipeListItem[]
  toggleFavorite: ToggleFavoriteMutation
}>) {
  const handleToggleFavorite = (recipeId: string) => {
    toggleFavorite.mutate({ recipeId })
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onToggleFavorite={handleToggleFavorite}
        />
      ))}
    </div>
  )
}

function RecipeCard({
  recipe,
  onToggleFavorite,
}: Readonly<{
  recipe: RecipeListItem
  onToggleFavorite: (recipeId: string) => void
}>) {
  const handleFavoriteClick = () => onToggleFavorite(recipe.id)

  return (
    <Card className="overflow-hidden border-border/80 py-0 gap-2 transition hover:shadow-lg">
      <div className="relative h-32 w-full bg-muted md:h-40">
        <RecipeImage imageUrl={recipe.imageUrl} title={recipe.title} />
        <button
          className="absolute right-2 top-2 rounded-full bg-background/80 p-2 shadow-sm transition hover:scale-105"
          onClick={handleFavoriteClick}
          aria-label="Переключить избранное"
        >
          <FavoriteIcon isFavorite={recipe.isFavorite} />
        </button>
      </div>
      <CardHeader className="space-y-1 px-3">
        <CardTitle className="line-clamp-2 wrap-break-word text-base leading-snug md:text-lg">
          {recipe.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-0">
        <RecipeMeta
          icon={Clock}
          value={`${recipe.preparationTimeMinutes} мин`}
        />
        <RecipeMeta icon={Flame} value={`${recipe.calories ?? '—'} ккал`} />
        <Button asChild variant="link" className="h-auto px-0 text-primary">
          <Link href={`/platform/recipes/${recipe.slug}`}>Подробнее</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function RecipeImage({
  imageUrl,
  title,
}: Readonly<{
  imageUrl: string | null | undefined
  title: string
}>) {
  if (!imageUrl) {
    return null
  }

  return <AppImage src={imageUrl} alt={title} fill className="object-cover" />
}

function FavoriteIcon({ isFavorite }: Readonly<{ isFavorite: boolean }>) {
  if (isFavorite) {
    return <Heart className="h-4 w-4 fill-red-500 text-red-500" />
  }

  return <Heart className="h-4 w-4 text-muted-foreground" />
}

function RecipeMeta({
  icon: Icon,
  value,
}: Readonly<{
  icon: typeof Clock
  value: string
}>) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground md:text-sm">
      <Icon className="h-4 w-4" />
      <span>{value}</span>
    </div>
  )
}

function FilterGroup({
  title,
  options,
  values,
  onToggle,
}: Readonly<{
  title: string
  options: ReadonlyArray<{ value: string; label: string }>
  values: string[]
  onToggle: (value: string) => void
}>) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <FilterGroupOptionButton
            key={option.value}
            isActive={values.includes(option.value)}
            onToggle={onToggle}
            option={option}
          />
        ))}
      </div>
    </div>
  )
}

function FilterGroupOptionButton({
  isActive,
  onToggle,
  option,
}: Readonly<{
  isActive: boolean
  onToggle: (value: string) => void
  option: { value: string; label: string }
}>) {
  const handleClick = () => onToggle(option.value)

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      className="justify-start w-fit"
    >
      {option.label}
    </Button>
  )
}

function FilterSwitchRow({
  checked,
  description,
  title,
  onCheckedChange,
}: Readonly<{
  checked: boolean
  description: string
  title: string
  onCheckedChange: (checked: boolean) => void
}>) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function toggleItem(list: string[], value: string) {
  return list.includes(value)
    ? list.filter(item => item !== value)
    : [...list, value]
}
