'use client'

import { useState } from 'react'
import { adminUsersApi } from '../_api'
import { coursesListApi } from '@/features/courses-list/_api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { Input } from '@/shared/ui/input'
import { addDays, format } from 'date-fns'
import { toast } from 'sonner'
import { Spinner } from '@/shared/ui/spinner'
import { selectDefaultCourseTariff } from '@/kernel/domain/course'

export function GrantAccessDialog({
  userId,
  disabled,
}: Readonly<{ userId: string; disabled?: boolean }>) {
  const [open, setOpen] = useState(false)
  const [courseId, setCourseId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const utils = adminUsersApi.useUtils()

  const coursesQuery = coursesListApi.coursesList.get.useQuery(undefined, {
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  })

  const grantMutation = adminUsersApi.admin.user.access.grant.useMutation({
    onSuccess: () => {
      setOpen(false)
      setCourseId('')
      setExpiresAt('')
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: error => {
      console.error(error)
      toast.error('Не удалось выдать доступ. Попробуйте ещё раз.')
    },
  })

  const courseOptions = coursesQuery.data ?? []
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      coursesQuery.refetch().catch(() => undefined)
    }
  }

  const handleChangeCourse = (value: string) => {
    setCourseId(value)
    const course = courseOptions.find(option => option.id === value)
    const defaultTariff = course
      ? selectDefaultCourseTariff(course.tariffs)
      : null
    const durationDays =
      defaultTariff?.access === 'paid'
        ? (defaultTariff.durationDays ?? 0)
        : 0
    if (durationDays > 0) {
      const endDate = addDays(new Date(), durationDays)
      setExpiresAt(format(endDate, 'yyyy-MM-dd'))
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!courseId) {
      return
    }

    grantMutation.mutate({
      userId,
      courseId,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    })
  }

  const isSubmitting = grantMutation.status === 'pending'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>Выдать доступ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Выдать доступ</DialogTitle>
          <DialogDescription>
            Предоставьте пользователю доступ к курсу без покупки.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Курс</Label>
            <Select
              value={courseId}
              onValueChange={handleChangeCourse}
              disabled={coursesQuery.isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите курс" />
              </SelectTrigger>
              <SelectContent>
                {courseOptions.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Доступ действует до</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={event => setExpiresAt(event.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !courseId}>
              {isSubmitting && <Spinner />} Выдать доступ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
