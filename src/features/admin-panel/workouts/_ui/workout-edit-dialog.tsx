'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { skipToken } from '@tanstack/react-query'
import {
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'
import { toast } from 'sonner'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { adminWorkoutsApi } from '../_api'
import {
  enumOptions,
  muscleLabels,
  practiceSections,
  sectionLabels,
  subsectionsBySection,
  subsectionLabels,
} from '../_constants'

type EditState = {
  id?: string
  title: string
  description: string
  videoId: string
  section: WorkoutSection
  difficulty: WorkoutDifficulty
  muscles: MuscleGroup[]
  subsections: WorkoutSubsection[]
  equipment: string
}

type WorkoutEditDialogProps = {
  workoutId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkoutEditDialog({
  workoutId,
  open,
  onOpenChange,
}: WorkoutEditDialogProps) {
  const utils = adminWorkoutsApi.useUtils()
  const [editState, setEditState] = useState<EditState | null>(null)

  const workoutDetailQuery = adminWorkoutsApi.adminWorkouts.workouts.get.useQuery(
    workoutId ? { id: workoutId } : skipToken,
    { enabled: Boolean(workoutId) }
  )

  const upsertMutation = adminWorkoutsApi.adminWorkouts.workouts.upsert.useMutation(
    {
      onSuccess: () => {
        toast('Тренировка сохранена')
        utils.adminWorkouts.workouts.list.invalidate()
        onOpenChange(false)
      },
      onError: (error: any) => {
        toast('Ошибка сохранения', { description: error?.message })
      },
    }
  )

  useEffect(() => {
    if (!open) {
      setEditState(null)
      return
    }

    const workout = workoutDetailQuery.data
    if (!workout) return

    const section = workout.section as WorkoutSection
    const allowedSubsections = subsectionsBySection[section] ?? []
    const workoutSubsections = Array.isArray(workout.subsections)
      ? (workout.subsections as WorkoutSubsection[])
      : []

    setEditState({
      id: workout.id,
      title: workout.title,
      description: workout.description ?? '',
      videoId: workout.videoId,
      section,
      difficulty: workout.difficulty as WorkoutDifficulty,
      muscles: Array.isArray(workout.muscles)
        ? (workout.muscles as MuscleGroup[])
        : [],
      subsections: allowedSubsections.length
        ? workoutSubsections.filter(subsection =>
            allowedSubsections.includes(subsection)
          )
        : workoutSubsections,
      equipment: (workout.equipment ?? []).join(', '),
    })
  }, [workoutDetailQuery.data, open])

  const handleSave = () => {
    if (!editState) return

    upsertMutation.mutate({
      id: editState.id,
      title: editState.title,
      description: editState.description || null,
      videoId: editState.videoId,
      section: editState.section,
      difficulty: editState.difficulty,
      muscles: editState.muscles,
      subsections: editState.subsections,
      equipment: editState.equipment
        ? editState.equipment
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
    })
  }

  const selectedTitle = useMemo(
    () => (editState ? `Редактирование: ${editState.title}` : ''),
    [editState]
  )

  const availableSubsections: WorkoutSubsection[] = useMemo(() => {
    if (!editState) return []
    return subsectionsBySection[editState.section] ?? []
  }, [editState])

  let dialogBody: ReactNode = (
    <div className="py-6 text-center text-sm text-muted-foreground">
      Загрузка данных...
    </div>
  )

  if (!workoutDetailQuery.isLoading && editState) {
    dialogBody = (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Название</Label>
            <Input
              value={editState.title}
              onChange={e =>
                setEditState(prev => prev && { ...prev, title: e.target.value })
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Описание</Label>
            <Textarea
              value={editState.description}
              onChange={e =>
                setEditState(
                  prev => prev && { ...prev, description: e.target.value }
                )
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Категория</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={editState.section}
              onChange={e =>
                setEditState(prev => {
                  if (!prev) return prev

                  const nextSection = e.target.value as WorkoutSection
                  const allowedSubsections =
                    subsectionsBySection[nextSection] ?? []

                  return {
                    ...prev,
                    section: nextSection,
                    subsections: prev.subsections.filter(subsection =>
                      allowedSubsections.includes(subsection)
                    ),
                  }
                })
              }
            >
              {practiceSections.map(option => (
                <option key={option} value={option}>
                  {sectionLabels[option] ?? option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Подкатегории</Label>
            {availableSubsections.length ? (
              <div className="flex flex-wrap gap-2">
                {availableSubsections.map(option => {
                  const checked = editState.subsections.includes(option)
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          setEditState(prev => {
                            if (!prev) return prev
                            const next = new Set(prev.subsections)
                            if (e.target.checked) {
                              next.add(option)
                            } else {
                              next.delete(option)
                            }
                            return {
                              ...prev,
                              subsections: Array.from(next),
                            }
                          })
                        }}
                      />
                      {subsectionLabels[option] ?? option}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Для этой категории нет подкатегорий.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Сложность</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={editState.difficulty}
              onChange={e =>
                setEditState(
                  prev =>
                    prev && {
                      ...prev,
                      difficulty: e.target.value as WorkoutDifficulty,
                    }
                )
              }
            >
              {enumOptions.difficulty.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Мышечные группы</Label>
            <div className="flex flex-wrap gap-2">
              {enumOptions.muscles.map(option => {
                const checked = editState.muscles.includes(option)
                return (
                  <label
                    key={option}
                    className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        setEditState(prev => {
                          if (!prev) return prev
                          const next = new Set(prev.muscles)
                          if (e.target.checked) {
                            next.add(option)
                          } else {
                            next.delete(option)
                          }
                          return { ...prev, muscles: Array.from(next) }
                        })
                      }}
                    />
                    {muscleLabels[option] ?? option}
                  </label>
                )
              })}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Инвентарь (через запятую)</Label>
            <Input
              value={editState.equipment}
              onChange={e =>
                setEditState(
                  prev => prev && { ...prev, equipment: e.target.value }
                )
              }
              placeholder="коврик, резинка"
            />
          </div>
        </div>
        <DialogFooter className="justify-start space-x-2">
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {selectedTitle || 'Редактирование тренировки'}
          </DialogTitle>
          {editState ? (
            <p className="text-sm text-muted-foreground">
              Video ID: {editState.videoId}
            </p>
          ) : null}
        </DialogHeader>
        {dialogBody}
      </DialogContent>
    </Dialog>
  )
}
