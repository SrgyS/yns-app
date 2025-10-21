'use client'

import { Button } from '@/shared/ui/button'
import { DayOfWeek } from '@prisma/client'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useCurrentDay } from '../_vm/use-current-day'
import { DayItem } from './day-item'

interface WorkoutDaySelectorProps {
  onSelectDays: (selectedDays: DayOfWeek[]) => void // Колбэк, который вызывается при подтверждении выбора
  requiredDays: number // Точное количество тренировочных дней, которые нужно выбрать
  isLoading?: boolean // Для состояния загрузки кнопки
  initialSelectedDays?: DayOfWeek[]
  disabled?: boolean
}

export function WorkoutDaySelector({
  onSelectDays,
  requiredDays,
  isLoading = false,
  initialSelectedDays = [],
  disabled = false,
}: WorkoutDaySelectorProps) {
  const [selectedDays, setSelectedDays] =
    useState<DayOfWeek[]>(initialSelectedDays)

  useEffect(() => {
    setSelectedDays(initialSelectedDays)
  }, [initialSelectedDays])

  const today = useCurrentDay()

  // Проверка, изменились ли выбранные дни
  const daysChanged = useMemo(() => {
    if (selectedDays.length !== initialSelectedDays.length) return true
    
    // Сортируем массивы для корректного сравнения
    const sortedSelected = [...selectedDays].sort()
    const sortedInitial = [...initialSelectedDays].sort()
    
    // Сравниваем каждый элемент
    return sortedSelected.some((day, index) => day !== sortedInitial[index])
  }, [selectedDays, initialSelectedDays])

  const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
    if (disabled) {
      return
    }

    setSelectedDays(prevDays => {
      if (checked) {
        if (prevDays.length >= requiredDays) {
          toast.error(`Вы можете выбрать не более ${requiredDays} дней.`)
          return prevDays
        }
        return [...prevDays, day]
      } else {
        return prevDays.filter(d => d !== day)
      }
    })
  }

  const handleSubmit = () => {
    if (selectedDays.length !== requiredDays) {
      toast.error(`Пожалуйста, выберите ${requiredDays} тренировочных дня.`)
      return
    }
    onSelectDays(selectedDays)
  }

  return (
    <div className="space-y-6 p-4 bg-card">

      <div className="flex flex-wrap justify-center gap-4">
        {Object.values(DayOfWeek).map(day => (
          <DayItem
            day={day}
            today={today}
            limit={requiredDays}
            key={day}
            selectedDays={selectedDays}
            onToggle={handleDayToggle}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={
          disabled ||
          selectedDays.length !== requiredDays ||
          isLoading ||
          !daysChanged // Добавляем проверку, изменились ли дни
          }
        >
          Продолжить
        </Button>
      </div>

      {!disabled && selectedDays.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Выбрано: {selectedDays.length} / {requiredDays} дней.
        </p>
      )}
    </div>
  )
}
