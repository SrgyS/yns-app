import { Button } from '@/shared/ui/button'
import { DayOfWeek } from '@prisma/client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useCurrentDay } from '../_vm/use-current-day'
import { DayItem } from './day-item'

interface WorkoutDaySelectorProps {
  // onSelectDays: (selectedDays: DayOfWeek[]) => void // Колбэк, который вызывается при подтверждении выбора
  minDays?: number // Минимальное количество дней для выбора (по умолчанию 5)
  maxDays?: number // Максимальное количество дней для выбора (по умолчанию 5)
  isLoading?: boolean // Для состояния загрузки кнопки
  initialSelectedDays?: DayOfWeek[]
}

export function WorkoutDaySelector({
  // onSelectDays,
  minDays = 5,
  maxDays = 5,
  isLoading = false,
  initialSelectedDays = [],
}: WorkoutDaySelectorProps) {
  const [selectedDays, setSelectedDays] =
    useState<DayOfWeek[]>(initialSelectedDays)

  useEffect(() => {
    setSelectedDays(initialSelectedDays)
  }, [initialSelectedDays])

  const today = useCurrentDay()

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
    // onSelectDays(selectedDays)
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm bg-card">
      <h2 className="text-xl font-semibold text-center">
        Выберите дни тренировок
      </h2>
      <p className="text-sm text-muted-foreground text-center">
        Пожалуйста, выберите {minDays} дней в неделю для ваших тренировок.
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

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={
            selectedDays.length < minDays ||
            selectedDays.length > maxDays ||
            isLoading
          }
        >
          Продолжить
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
