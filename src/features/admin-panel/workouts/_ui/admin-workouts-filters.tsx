import { WorkoutDifficulty, WorkoutSection } from '@prisma/client'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { PRACTICE_TYPES } from '@/features/practices/_constants/practice-types'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'

export type WorkoutsFilters = {
  search: string
  status: 'all' | 'needsReview' | 'ready'
  section: WorkoutSection | 'all'
  difficulty: WorkoutDifficulty | 'all'
  sortDir: 'desc' | 'asc'
}

const sectionLabels = PRACTICE_TYPES.reduce<Record<WorkoutSection, string>>(
  (acc, practice) => {
    if (!acc[practice.section]) {
      acc[practice.section] = practice.title
    }
    return acc
  },
  {} as Record<WorkoutSection, string>
)

const practiceSections = Array.from(
  new Set(PRACTICE_TYPES.map(practice => practice.section))
)

type Props = {
  filters: WorkoutsFilters
  onChange: (key: keyof WorkoutsFilters, value: any) => void
  onReset: () => void
}

export function AdminWorkoutsFilters({
  filters,
  onChange,
  onReset,
}: Readonly<Props>) {
  const isDirty =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.section !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.sortDir !== 'desc'

  return (
    <Card className="max-w-fit border-primary bg-primary/10">
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64 space-y-1">
            <Label>Поиск</Label>
            <Input
              value={filters.search}
              onChange={e => onChange('search', e.target.value)}
              placeholder="Название тренировки..."
              className='bg-background'
            />
          </div>
          <div className="flex flex-1 flex-wrap items-end gap-4">
            <div className="space-y-1 min-w-[140px]">
              <Label>Категория</Label>
              <Select
                value={filters.section}
                onValueChange={value => onChange('section', value)}
                
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {practiceSections.map(option => (
                    <SelectItem key={option} value={option}>
                      {sectionLabels[option] ?? option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label>Сложность</Label>
              <Select
                value={filters.difficulty}
                onValueChange={value => onChange('difficulty', value)}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {Object.values(WorkoutDifficulty).map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label>Статус</Label>
              <Select
                value={filters.status}
                onValueChange={value => onChange('status', value)}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="needsReview">Заполнить</SelectItem>
                  <SelectItem value="ready">Готово</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <Label>Сортировка</Label>
              <Select
                value={filters.sortDir}
                onValueChange={value => onChange('sortDir', value)}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Сначала новые" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Сначала новые</SelectItem>
                  <SelectItem value="asc">Сначала старые</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="secondary"
          onClick={onReset}
          disabled={!isDirty}
          className="text-muted-foreground hover:text-foreground"
        >
          х Сбросить
        </Button>
      </CardFooter>
    </Card>
  )
}
