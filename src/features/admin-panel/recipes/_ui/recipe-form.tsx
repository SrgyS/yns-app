'use client'

import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, Upload } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Checkbox } from '@/shared/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { adminRecipesApi } from '../_api'
import { Switch } from '@/shared/ui/switch'
import { Label } from '@/shared/ui/label'
import { ALLOWED_IMAGE_TYPES, DEFAULT_IMAGE_MAX_SIZE_MB } from '@/shared/lib/upload-constants'

const ingredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Укажите название'),
  quantity: z.number().nullable().optional(),
  unit: z.string().optional(),
  weightGrams: z.number().nullable().optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

const stepSchema = z.object({
  id: z.string().optional(),
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1, 'Опишите шаг'),
})

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  preparationTimeMinutes: z.number().int().positive(),
  calories: z.number().int().positive().nullable().optional(),
  servings: z.number().int().positive(),
  cookingDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  imageUrl: z.string().nullable().optional(),
  diets: z.array(
    z.enum([
      'VEGETARIAN',
      'HIGH_PROTEIN',
      'LOW_CARB',
      'GLUTEN_FREE',
      'VEGAN',
      'LOW_CALORIE',
      'LACTOSE_FREE',
      'SUGAR_FREE',
    ])
  ),
  ingredientTags: z.array(
    z.enum([
      'FISH',
      'SEAFOOD',
      'NUTS',
      'EGGS',
      'DAIRY',
      'PORK',
      'BEEF',
      'BREAD',
      'PASTA',
      'RICE',
      'POTATO',
      'AVOCADO',
      'SALMON',
      'BACON',
      'SPINACH',
    ])
  ),
  isGlutenFree: z.boolean().optional(),
  isSugarFree: z.boolean().optional(),
  mealCategories: z.array(
    z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'SALAD', 'DESSERT', 'SOUP'])
  ),
  ingredients: z.array(ingredientSchema),
  steps: z.array(stepSchema),
})

type FormValues = z.infer<typeof formSchema>

type RecipeFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe?: any
  onSuccess: () => void
}

export function RecipeForm({
  open,
  onOpenChange,
  recipe,
  onSuccess,
}: Readonly<RecipeFormProps>) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      shortDescription: '',
      preparationTimeMinutes: 10,
      calories: null,
      servings: 1,
      cookingDifficulty: 'EASY',
      imageUrl: null,
      diets: [],
      ingredientTags: [],
      isGlutenFree: false,
      isSugarFree: false,
      mealCategories: [],
      ingredients: [],
      steps: [],
    },
  })

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } =
    useFieldArray({
      control: form.control,
      name: 'ingredients',
    })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: 'steps',
  })

  const createMutation = adminRecipesApi.adminRecipes.create.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: err => toast.error(err.message),
  })

  const updateMutation = adminRecipesApi.adminRecipes.update.useMutation({
    onSuccess: () => {
      onSuccess()
    },
    onError: err => toast.error(err.message),
  })

  const uploadPhotoMutation = adminRecipesApi.adminRecipes.uploadPhoto.useMutation({
    onSuccess: data => {
      form.setValue('imageUrl', data.path)
      toast.success('Фото загружено')
    },
    onError: err => toast.error(err.message),
  })

  useEffect(() => {
    if (recipe) {
      form.reset({
        title: recipe.title ?? '',
        slug: recipe.slug ?? '',
        description: recipe.description ?? '',
        shortDescription: recipe.shortDescription ?? '',
        preparationTimeMinutes: recipe.preparationTimeMinutes ?? 10,
        calories: recipe.calories ?? null,
        servings: recipe.servings ?? 1,
        cookingDifficulty: recipe.cookingDifficulty ?? 'EASY',
        imageUrl: recipe.imageUrl ?? null,
        diets: recipe.diets ?? [],
        ingredientTags: recipe.ingredientTags ?? [],
        isGlutenFree: recipe.isGlutenFree ?? false,
        isSugarFree: recipe.isSugarFree ?? false,
        mealCategories: recipe.mealCategories ?? [],
        ingredients: (recipe.ingredients ?? []).map((item: any) => ({
          id: item.id,
          name: item.name ?? '',
          quantity: item.quantity ?? null,
          unit: item.unit ?? '',
          weightGrams: item.weightGrams ?? null,
          description: item.description ?? '',
          order: item.order ?? 0,
        })),
        steps: (recipe.steps ?? []).map((item: any) => ({
          id: item.id,
          stepNumber: item.stepNumber ?? 1,
          instruction: item.instruction ?? '',
        })),
      })
    } else {
      form.reset({
        title: '',
        slug: '',
        description: '',
        shortDescription: '',
        preparationTimeMinutes: 10,
        calories: null,
        servings: 1,
        cookingDifficulty: 'EASY',
        imageUrl: null,
        diets: [],
        ingredientTags: [],
        isGlutenFree: false,
        isSugarFree: false,
        mealCategories: [],
        ingredients: [],
        steps: [],
      })
    }
  }, [form, recipe, open])

  const onSubmit = (values: FormValues) => {
    if (recipe) {
      updateMutation.mutate({ id: recipe.id, ...values })
      return
    }
    createMutation.mutate({
      ...values,
      calories: values.calories ?? undefined,
      imageUrl: values.imageUrl ?? undefined,
    })
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error('Недопустимый формат изображения')
      return
    }

    const maxBytes = DEFAULT_IMAGE_MAX_SIZE_MB * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error(`Размер файла превышает ${DEFAULT_IMAGE_MAX_SIZE_MB} МБ`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        toast.error('Не удалось прочитать файл')
        return
      }
      const base64 = result.split(',')[1] ?? ''
      uploadPhotoMutation.mutate({
        fileName: file.name,
        fileType: file.type,
        base64,
        tag: 'site/recipe-image',
      })
    }
    reader.onerror = () => toast.error('Не удалось загрузить изображение')
    reader.readAsDataURL(file)
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Редактировать рецепт' : 'Создать рецепт'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input placeholder="Например, Омлет с овощами" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="omlet-s-ovoshchami" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="preparationTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Время приготовления (мин)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ккал (на порцию)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => {
                          const value = e.target.value
                          if (value === '') {
                            field.onChange(null)
                            return
                          }
                          field.onChange(Number(value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Порции</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cookingDifficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сложность</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={val => field.onChange(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите сложность" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">Просто</SelectItem>
                        <SelectItem value="MEDIUM">Средне</SelectItem>
                        <SelectItem value="HARD">Сложно</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Изображение</FormLabel>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="https://..."
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="whitespace-nowrap"
                      asChild
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Загрузить
                        <input
                          type="file"
                          accept={Array.from(ALLOWED_IMAGE_TYPES).join(',')}
                          className="hidden"
                          onChange={handleUpload}
                        />
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WEBP до {DEFAULT_IMAGE_MAX_SIZE_MB} МБ
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Краткое описание</FormLabel>
                  <FormControl>
                    <Input placeholder="Краткая подводка" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Подробности" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="mealCategories"
                render={({ field }) => {
                  const current = field.value ?? []

                  return (
                    <FormItem>
                      <FormLabel>Прием пищи</FormLabel>
                      <div className="space-y-2 rounded-md border p-3">
                        {mealCategoryOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={current.includes(option.value)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...current, option.value])
                                } else {
                                  field.onChange(current.filter(item => item !== option.value))
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="diets"
                render={({ field }) => {
                  const current = field.value ?? []

                  return (
                    <FormItem>
                      <FormLabel>Диета</FormLabel>
                      <div className="space-y-2 rounded-md border p-3">
                        {dietOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={current.includes(option.value)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...current, option.value])
                                } else {
                                  field.onChange(current.filter(item => item !== option.value))
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="ingredientTags"
                render={({ field }) => {
                  const current = field.value ?? []

                  return (
                    <FormItem>
                      <FormLabel>Ингредиенты (теги)</FormLabel>
                      <div className="space-y-2 rounded-md border p-3">
                        {ingredientTagOptions.map(option => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={current.includes(option.value)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  field.onChange([...current, option.value])
                                } else {
                                  field.onChange(current.filter(item => item !== option.value))
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isGlutenFree"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Без глютена</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Отметьте, если рецепт без глютена
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={checked => field.onChange(Boolean(checked))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isSugarFree"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Без сахара</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Отметьте, если рецепт без добавленного сахара
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={checked => field.onChange(Boolean(checked))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Ингредиенты</Label>
                  <p className="text-xs text-muted-foreground">
                    Укажите количество, единицы и порядок отображения
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendIngredient({
                      name: '',
                      quantity: null,
                      unit: '',
                      weightGrams: null,
                      description: '',
                      order: ingredientFields.length,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-4">
                {ingredientFields.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="grid gap-3 rounded-md border p-3 md:grid-cols-12 md:items-center"
                  >
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Название</FormLabel>
                          <FormControl>
                            <Input placeholder="Авокадо" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Количество</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value
                                if (value === '') {
                                  field.onChange(null)
                                  return
                                }
                                field.onChange(Number(value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.unit`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Ед.</FormLabel>
                          <FormControl>
                            <Input placeholder="шт / чашка / г" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.weightGrams`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Граммы</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value
                                if (value === '') {
                                  field.onChange(null)
                                  return
                                }
                                field.onChange(Number(value))
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.order`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>Порядок</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Input placeholder="рубленная / поджаренный" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-12 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(index)}
                        aria-label="Удалить ингредиент"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Шаги приготовления</Label>
                  <p className="text-xs text-muted-foreground">Порядок будет сохранен по stepNumber</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendStep({
                      stepNumber: stepFields.length + 1,
                      instruction: '',
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить шаг
                </Button>
              </div>
              <div className="space-y-4">
                {stepFields.map((item, index) => (
                  <div
                    key={item.id ?? index}
                    className="grid gap-3 rounded-md border p-3 md:grid-cols-12 md:items-start"
                  >
                    <FormField
                      control={form.control}
                      name={`steps.${index}.stepNumber`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Шаг</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`steps.${index}.instruction`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-9">
                          <FormLabel>Описание шага</FormLabel>
                          <FormControl>
                            <Textarea rows={2} placeholder="Опишите действие" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                        aria-label="Удалить шаг"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const mealCategoryOptions = [
  { value: 'BREAKFAST', label: 'Завтрак' },
  { value: 'LUNCH', label: 'Обед' },
  { value: 'DINNER', label: 'Ужин' },
  { value: 'SNACK', label: 'Перекус' },
  { value: 'SALAD', label: 'Салат' },
  { value: 'DESSERT', label: 'Десерт' },
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

const ingredientTagOptions = [
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
