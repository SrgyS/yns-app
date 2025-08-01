import { Button } from '@/shared/ui/button'
import { DayOfWeek } from '@prisma/client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useCurrentDay } from '../_vm/use-current-day'
import { DayItem } from './day-item'

interface EditWorkoutDaysProps {
  currentSelectedDays: DayOfWeek[]
  onUpdateDays: (selectedDays: DayOfWeek[]) => void
  minDays?: number
  maxDays?: number
  isLoading?: boolean
}

export function EditWorkoutDays({
  currentSelectedDays,
  onUpdateDays,
  minDays = 5,
  maxDays = 5,
  isLoading = false,
}: EditWorkoutDaysProps) {
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const today = useCurrentDay()

  useEffect(() => {
    setSelectedDays(currentSelectedDays)
  }, [currentSelectedDays])

  const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
    setSelectedDays(prevDays => {
      if (checked) {
        if (prevDays.length >= maxDays) {
          toast.error(`Вы можете выбрать не более ${maxDays} дней.`)
          return prevDays
        }
        return [...prevDays, day]
      } else {
        return prevDays.filter(d => d !== day)
      }
    })
  }

  const handleSubmit = () => {
    if (selectedDays.length < minDays || selectedDays.length > maxDays) {
      toast.error(`Пожалуйста, выберите от ${minDays} до ${maxDays} дней.`)
      return
    }

    const hasChanges =
      selectedDays.length !== currentSelectedDays.length ||
      selectedDays.some(day => !currentSelectedDays.includes(day)) ||
      currentSelectedDays.some(day => !selectedDays.includes(day))

    if (!hasChanges) {
      toast.info('Дни тренировок не изменились.')
      return
    }

    onUpdateDays(selectedDays)
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <h2 className="text-xl font-semibold text-center">
        Изменить дни тренировок
      </h2>
      <p className="text-sm text-muted-foreground text-center">
        Выберите {minDays} дней в неделю для ваших тренировок. Изменения
        применятся только к будущим дням.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {Object.values(DayOfWeek).map(day => (
          <DayItem
            day={day}
            today={today}
            maxDays={maxDays}
            key={day}
            selectedDays={selectedDays}
            onToggle={handleDayToggle}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={
            selectedDays.length < minDays ||
            selectedDays.length > maxDays ||
            isLoading
          }
        >
          Сохранить изменения
        </Button>
      </div>

      {selectedDays.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Выбрано: {selectedDays.length} / {maxDays} дней.
        </p>
      )}
    </div>
  )
}
