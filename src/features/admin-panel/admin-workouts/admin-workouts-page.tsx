'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { WorkoutDifficulty, WorkoutSection, WorkoutType } from '@prisma/client'
import { toast } from 'sonner'

import { adminWorkoutsApi } from './_api'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

const enumOptions = {
  type: Object.values(WorkoutType),
  section: Object.values(WorkoutSection),
  difficulty: Object.values(WorkoutDifficulty),
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const padded = secs < 10 ? `0${secs}` : secs
  return `${mins}:${padded}`
}

type EditState = {
  id?: string
  slug: string
  title: string
  description: string
  videoId: string
  type: WorkoutType
  section: WorkoutSection
  difficulty: WorkoutDifficulty
  muscles: string
  subsections: string
  equipment: string
}

export function AdminWorkoutsPage() {
  const [editState, setEditState] = useState<EditState | null>(null)
  const utils = adminWorkoutsApi.useUtils() as any
  const api = adminWorkoutsApi as any
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = api.adminWorkouts.workouts.list.useInfiniteQuery(
    {
      pageSize: 20,
    },
    {
      initialCursor: 1,
      getNextPageParam: (lastPage: any) =>
        lastPage.page * lastPage.pageSize < lastPage.total
          ? lastPage.page + 1
          : undefined,
    }
  )

  const workouts = useMemo(() => {
    const seen = new Set<string>()
    const result: any[] = []
    ;(data?.pages ?? []).forEach((page: any) => {
      ;(page.items ?? []).forEach((w: any) => {
        const key = w?.videoId || w?.slug || w?.id
        if (key && !seen.has(key)) {
          seen.add(key)
          result.push(w)
        }
      })
    })
    return result
  }, [data])
  const total = data?.pages?.[0]?.total ?? 0

  const syncMutation = api.adminWorkouts.workouts.sync.useMutation({
    onSuccess: (result: { created: number; updated: number; skippedManual: number }) => {
      toast('Синхронизация завершена', {
        description: `Создано: ${result.created}, обновлено: ${result.updated}, пропущено (ручные): ${result.skippedManual}`,
      })
      utils.adminWorkouts.workouts.list.invalidate()
    },
    onError: (error: any) => {
      toast('Ошибка синхронизации', { description: error?.message })
    },
  })

  const upsertMutation = api.adminWorkouts.workouts.upsert.useMutation({
    onSuccess: () => {
      toast('Тренировка сохранена')
      utils.adminWorkouts.workouts.list.invalidate()
      setEditState(null)
    },
    onError: (error: any) => {
      toast('Ошибка сохранения', { description: error?.message })
    },
  })

  const startEdit = (workout: any) => {
    setEditState({
      id: workout.id,
      slug: workout.slug,
      title: workout.title,
      description: workout.description ?? '',
      videoId: workout.videoId,
      type: workout.type,
      section: workout.section,
      difficulty: workout.difficulty,
      muscles: (workout.muscles ?? []).join(', '),
      subsections: (workout.subsections ?? []).join(', '),
      equipment: (workout.equipment ?? []).join(', '),
    })
  }

  const handleSave = () => {
    if (!editState) return

    upsertMutation.mutate({
      id: editState.id,
      slug: editState.slug,
      title: editState.title,
      description: editState.description || null,
      videoId: editState.videoId,
      type: editState.type,
      section: editState.section,
      difficulty: editState.difficulty,
      muscles: editState.muscles
        ? editState.muscles.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      subsections: editState.subsections
        ? editState.subsections.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      equipment: editState.equipment
        ? editState.equipment.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    })
  }

  const statusBadge = (workout: any) => {
    if (workout.needsReview) {
      return <Badge variant="destructive">Требует проверки</Badge>
    }
    if (workout.manuallyEdited) {
      return <Badge variant="secondary">Отредактировано</Badge>
    }
    return <Badge variant="outline">Готово</Badge>
  }

  const selectedTitle = useMemo(
    () => (editState ? `Редактирование: ${editState.title || editState.slug}` : ''),
    [editState]
  )

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      })
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Тренировки</h1>
          <p className="text-muted-foreground">
            Синхронизация с Kinescope и ручное приведение к требуемой схеме.
          </p>
        </div>
        <Button
          disabled={syncMutation.isLoading}
          onClick={() =>
            syncMutation.mutate({ overwriteManuallyEdited: false, folderId: undefined })
          }
        >
          {syncMutation.isLoading ? 'Загрузка...' : 'Загрузить видео из Kinescope'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все тренировки</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Секция</TableHead>
                  <TableHead>Сложность</TableHead>
                  <TableHead>Дата загрузки</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout: any) => (
                  <TableRow key={workout.videoId || workout.slug || workout.id}>
                    <TableCell className="flex items-center gap-3">
                      {workout.posterUrl ? (
                        <div className="relative h-14 w-24 overflow-hidden rounded border">
                          <Image
                            src={workout.posterUrl}
                            alt={workout.title}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-24 items-center justify-center rounded border text-xs text-muted-foreground">
                          Нет обложки
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{workout.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(workout.durationSec ?? 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {workout.slug}
                    </TableCell>
                    <TableCell>{workout.section}</TableCell>
                    <TableCell>{workout.difficulty}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {workout.createdAt
                        ? format(new Date(workout.createdAt), 'dd.MM.yyyy', { locale: ru })
                        : workout.created_at
                          ? format(new Date(workout.created_at), 'dd.MM.yyyy', { locale: ru })
                          : '—'}
                    </TableCell>
                    <TableCell>{statusBadge(workout)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(workout)}
                      >
                        Редактировать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            {total ? `${workouts.length} из ${total}` : null}
          </div>
          <div ref={loadMoreRef} className="h-10 w-full" />
          {isFetchingNextPage ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : null}
        </CardContent>
      </Card>

      {editState && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editState.slug} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Video ID</Label>
                <Input value={editState.videoId} readOnly />
              </div>
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
                    setEditState(prev => prev && { ...prev, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Тип</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editState.type}
                  onChange={e =>
                    setEditState(prev => prev && { ...prev, type: e.target.value as WorkoutType })
                  }
                >
                  {enumOptions.type.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Секция</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editState.section}
                  onChange={e =>
                    setEditState(
                      prev => prev && { ...prev, section: e.target.value as WorkoutSection }
                    )
                  }
                >
                  {enumOptions.section.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Сложность</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editState.difficulty}
                  onChange={e =>
                    setEditState(
                      prev =>
                        prev && { ...prev, difficulty: e.target.value as WorkoutDifficulty }
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
                <Label>Мышечные группы (через запятую)</Label>
                <Input
                  value={editState.muscles}
                  onChange={e =>
                    setEditState(prev => prev && { ...prev, muscles: e.target.value })
                  }
                  placeholder="LEGS, BACK"
                />
              </div>
              <div className="space-y-2">
                <Label>Подсекции (через запятую)</Label>
                <Input
                  value={editState.subsections}
                  onChange={e =>
                    setEditState(prev => prev && { ...prev, subsections: e.target.value })
                  }
                  placeholder="WARMUP, ..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Инвентарь (через запятую)</Label>
                <Input
                  value={editState.equipment}
                  onChange={e =>
                    setEditState(prev => prev && { ...prev, equipment: e.target.value })
                  }
                  placeholder="коврик, резинка"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={upsertMutation.isLoading}>
                {upsertMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setEditState(null)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
