'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'

interface WorkoutProgressDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSaveWithProgress: () => Promise<void>
  onSaveWithoutProgress: () => Promise<void>
  isLoading?: boolean
}

export function WorkoutProgressDialog({
  isOpen,
  onOpenChange,
  onSaveWithProgress,
  onSaveWithoutProgress,
  isLoading = false,
}: WorkoutProgressDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Сохранение прогресса</DialogTitle>
          <DialogDescription>
            Хотите ли вы сохранить прогресс выполненных тренировок при изменении расписания?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Если вы сохраните прогресс, статусы выполненных тренировок будут перенесены 
            в новое расписание. В противном случае все тренировки будут отмечены как невыполненные.
          </p>
        </div>
        <DialogFooter className="flex justify-center  sm:justify-center">
          <Button 
            variant="destructive" 
            onClick={onSaveWithoutProgress}
            disabled={isLoading}
          >
            Сбросить прогресс
          </Button>
          <Button 
            onClick={onSaveWithProgress}
            disabled={isLoading}
          >
            Сохранить прогресс
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}