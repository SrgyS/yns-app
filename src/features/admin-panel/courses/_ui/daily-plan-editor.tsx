'use client'

import { useEffect, useMemo, useState } from 'react'
import { WorkoutSection } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { adminCoursesApi } from '../_api'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Badge } from '@/shared/ui/badge'
import { Checkbox } from '@/shared/ui/checkbox'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/ui/utils'
import { formatDuration } from '@/shared/lib/format-duration'
import { WorkoutPickerDialog, WorkoutSummary } from './workout-picker-dialog'

type DayState = {
  id: string
  slug: string
  weekNumber: number
  dayNumberInWeek: number
  description?: string | null
  onlyWarmup: boolean
  warmup: WorkoutSummary
  mainWorkout?: WorkoutSummary | null
  mealPlanId?: string | null
}

type PickerTarget = {
  weekNumber: number
  dayNumberInWeek: number
  kind: 'warmup' | 'main'
} | null

const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const sectionLabels: Record<string, string> = {
  [WorkoutSection.STRENGTH]: 'Силовые',
  [WorkoutSection.CORRECTION]: 'Коррекция осанки',
  [WorkoutSection.FUNCTIONAL]: 'Функциональные',
  [WorkoutSection.WARMUP]: 'Зарядки',
  [WorkoutSection.PAIN]: 'Решает боль',
}

type DayCardProps = {
  day: DayState
  isDirty: boolean
  onPick: (args: { day: DayState; kind: 'warmup' | 'main' }) => void
  onToggleOnlyWarmup: (day: DayState) => void
}

function DayCard({
  day,
  isDirty,
  onPick,
  onToggleOnlyWarmup,
}: Readonly<DayCardProps>) {
  const onlyWarmup = day.onlyWarmup
  const isStub = !day.id

  return (
    <Card
      className={cn('border-muted-foreground/20', isDirty && 'border-primary')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {weekdayLabels[day.dayNumberInWeek - 1]}
          </CardTitle>
          {onlyWarmup ? (
            <Badge variant="outline">Только зарядка</Badge>
          ) : (
            <Badge>Есть тренировка</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Зарядка</p>
          <div className="flex items-center justify-between gap-2">
            <WorkoutInfo workout={day.warmup} />
            <Button
              variant="outline"
              size="sm"
              disabled={isStub}
              onClick={() => onPick({ day, kind: 'warmup' })}
            >
              Выбрать
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Тренировка</p>
            {day.mainWorkout ? (
              <WorkoutInfo workout={day.mainWorkout} />
            ) : (
              <div className="text-sm text-muted-foreground">Не выбрано</div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isStub}
            onClick={() => onPick({ day, kind: 'main' })}
          >
            Выбрать
          </Button>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={onlyWarmup}
            onCheckedChange={() => onToggleOnlyWarmup(day)}
            disabled={isStub}
          />
          Только зарядка
        </label>
      </CardContent>
    </Card>
  )
}

function WorkoutInfo({ workout }: Readonly<{ workout: WorkoutSummary }>) {
  return (
    <div>
      <div className="font-medium">{workout.title}</div>
      <div className="text-xs text-muted-foreground">
        {sectionLabels[workout.section ?? ''] ?? 'Тип не указан'} ·{' '}
        {formatDuration(workout.durationSec)}
      </div>
    </div>
  )
}

export function DailyPlanEditor({ slug }: Readonly<{ slug: string }>) {
  const router = useRouter()
  const utils = adminCoursesApi.useUtils()
  const courseQuery = adminCoursesApi.adminCourses.course.get.useQuery({ slug })

  const dailyPlanUpdate =
    adminCoursesApi.adminCourses.course.dailyPlan.update.useMutation()

  const [activeWeek, setActiveWeek] = useState<string>('1')
  const [weekState, setWeekState] = useState<Record<number, DayState[]>>({})
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set())
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)

  const course = courseQuery.data
  const maxAllowedWorkoutDays = useMemo(() => {
    if (!course || !course.allowedWorkoutDaysPerWeek?.length) return 0
    return Math.max(...course.allowedWorkoutDaysPerWeek)
  }, [course])

  useEffect(() => {
    if (!course) return

    const byWeek: Record<number, DayState[]> = {}
    const weeks = Array.from({ length: course.durationWeeks }).map(
      (_v, idx) => idx + 1
    )

    for (const weekNumber of weeks) {
      const days = Array.from({ length: 7 }).map((_d, idx) => {
        const dayNumberInWeek = idx + 1
        const plan =
          course.dailyPlans?.find(
            dp =>
              dp.weekNumber === weekNumber &&
              dp.dayNumberInWeek === dayNumberInWeek
          ) ?? null

        return {
          id: plan?.id ?? `${weekNumber}-${dayNumberInWeek}`,
          slug: plan?.slug ?? '',
          weekNumber,
          dayNumberInWeek,
          description: plan?.description ?? null,
          onlyWarmup: !plan?.mainWorkoutId,
          warmup: {
            id: plan?.warmupId ?? '',
            title: plan?.warmupTitle ?? 'Не выбрано',
            durationSec: plan?.warmupDurationSec ?? undefined,
            section: plan?.warmupSection ?? undefined,
          },
          mainWorkout: plan?.mainWorkoutId
            ? {
                id: plan.mainWorkoutId,
                title: plan.mainWorkoutTitle ?? 'Тренировка',
                durationSec: plan.mainWorkoutDurationSec ?? undefined,
                section: plan.mainWorkoutSection ?? undefined,
              }
            : null,
          mealPlanId: plan?.mealPlanId ?? null,
        }
      })
      byWeek[weekNumber] = days
    }

    setWeekState(byWeek)
    setActiveWeek(String(weeks[0] ?? '1'))
    setDirtyIds(new Set())
  }, [course])

  const markDirty = (dayId: string) => {
    if (!dayId) return
    setDirtyIds(prev => new Set(prev).add(dayId))
  }

  const updateDay = (
    weekNumber: number,
    dayNumberInWeek: number,
    updater: (day: DayState) => DayState
  ) => {
    setWeekState(prev => {
      const targetWeek = prev[weekNumber]
      if (!targetWeek) return prev

      const idx = targetWeek.findIndex(
        day => day.dayNumberInWeek === dayNumberInWeek
      )
      if (idx === -1) return prev

      const updatedDay = updater(targetWeek[idx])
      const nextWeek = [...targetWeek]
      nextWeek[idx] = updatedDay

      return { ...prev, [weekNumber]: nextWeek }
    })
  }

  const handleSelectWorkout = (workout: WorkoutSummary) => {
    if (!pickerTarget) return

    updateDay(pickerTarget.weekNumber, pickerTarget.dayNumberInWeek, day => {
      const next: DayState =
        pickerTarget.kind === 'warmup'
          ? {
              ...day,
              onlyWarmup: false,
              warmup: {
                id: workout.id,
                title: workout.title,
                section: workout.section,
                durationSec: workout.durationSec,
                posterUrl: workout.posterUrl,
              },
            }
          : {
              ...day,
              onlyWarmup: false,
              mainWorkout: {
                id: workout.id,
                title: workout.title,
                section: workout.section,
                durationSec: workout.durationSec,
                posterUrl: workout.posterUrl,
              },
            }

      markDirty(day.id)
      return next
    })

    setPickerTarget(null)
  }

  const toggleOnlyWarmup = (day: DayState) => {
    updateDay(day.weekNumber, day.dayNumberInWeek, current => {
      const next = {
        ...current,
        onlyWarmup: !current.onlyWarmup,
        mainWorkout: current.onlyWarmup ? current.mainWorkout : null,
      }
      markDirty(current.id)
      return next
    })
  }

  const activeWeekNumber = Number(activeWeek)
  const activeWeekDays = weekState[activeWeekNumber] ?? []
  const activeWeekWorkoutDays = activeWeekDays.filter(
    day => !day.onlyWarmup && day.mainWorkout
  ).length

  const saveWeek = async () => {
    if (!activeWeekNumber) return
    if (maxAllowedWorkoutDays > 0) {
      if (activeWeekWorkoutDays < maxAllowedWorkoutDays) {
        toast.error(
          `Нужно минимум ${maxAllowedWorkoutDays} тренировок на неделе (сейчас ${activeWeekWorkoutDays}).`
        )
        return
      }
      if (activeWeekWorkoutDays > maxAllowedWorkoutDays) {
        toast.error(
          `Максимум ${maxAllowedWorkoutDays} тренировок на неделе (сейчас ${activeWeekWorkoutDays}). Уберите лишние дни с основной тренировкой.`
        )
        return
      }
    }

    const changedDays = activeWeekDays.filter(
      day => day.id && dirtyIds.has(day.id)
    )

    if (changedDays.length === 0) {
      toast.info('Нет изменений для сохранения')
      return
    }

    try {
      await Promise.all(
        changedDays.map(day =>
          dailyPlanUpdate.mutateAsync({
            id: day.id,
            description: day.description ?? null,
            warmupId: day.warmup.id,
            mainWorkoutId: day.mainWorkout?.id ?? null,
            mealPlanId: day.mealPlanId ?? null,
          })
        )
      )

      const nextDirty = new Set(dirtyIds)
      for (const day of changedDays) {
        nextDirty.delete(day.id)
      }
      setDirtyIds(nextDirty)

      utils.adminCourses.course.get.invalidate({ slug })

      toast.success('Неделя сохранена')
    } catch (_error) {
      console.error(_error)
      toast.error('Не удалось сохранить изменения')
    }
  }

  const isLoading = courseQuery.isLoading
  const isSaving = dailyPlanUpdate.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            План тренировок
          </h1>
          <p className="text-muted-foreground">
            Недели и дни курса «{course?.title ?? ''}». Максимум тренировок в
            неделю: {maxAllowedWorkoutDays || '—'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/courses/${slug}`)}
          >
            Назад
          </Button>
          <Button onClick={saveWeek} disabled={isSaving || isLoading}>
            {isSaving && <Spinner className="mr-2 h-4 w-4" />}
            Сохранить неделю
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Недельный план</CardTitle>
          <CardDescription>
            Активная неделя: {activeWeek}. Дней с основной тренировкой:{' '}
            {activeWeekWorkoutDays}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Spinner className="h-4 w-4" />
              Загрузка курса...
            </div>
          )}

          {!isLoading && (
            <Tabs
              value={activeWeek}
              onValueChange={setActiveWeek}
              className="w-full"
            >
              <TabsList className="mb-4">
                {Array.from({ length: course?.durationWeeks ?? 0 }).map(
                  (_v, idx) => {
                    const weekNumber = idx + 1
                    const hasUnsaved = (weekState[weekNumber] ?? []).some(day =>
                      dirtyIds.has(day.id)
                    )
                    return (
                      <TabsTrigger
                        key={weekNumber}
                        value={String(weekNumber)}
                        className="relative"
                      >
                        Неделя {weekNumber}
                        {hasUnsaved && (
                          <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      </TabsTrigger>
                    )
                  }
                )}
              </TabsList>

              {Array.from({ length: course?.durationWeeks ?? 0 }).map(
                (_v, idx) => {
                  const weekNumber = idx + 1
                  const days = weekState[weekNumber] ?? []

                  return (
                    <TabsContent
                      key={weekNumber}
                      value={String(weekNumber)}
                      className="mt-0"
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {days.map(day => (
                          <DayCard
                            key={`${day.weekNumber}-${day.dayNumberInWeek}`}
                            day={day}
                            isDirty={dirtyIds.has(day.id)}
                            onPick={({ day: pickedDay, kind }) =>
                              setPickerTarget({
                                weekNumber,
                                dayNumberInWeek: pickedDay.dayNumberInWeek,
                                kind,
                              })
                            }
                            onToggleOnlyWarmup={toggleOnlyWarmup}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  )
                }
              )}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <WorkoutPickerDialog
        open={Boolean(pickerTarget)}
        kind={pickerTarget?.kind ?? 'main'}
        onClose={() => setPickerTarget(null)}
        onSelect={handleSelectWorkout}
      />
    </div>
  )
}
