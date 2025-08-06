'use client'

import { Badge } from '@/shared/ui/badge'
import { Checkbox } from '@/shared/ui/checkbox'
import { Label } from '@/shared/ui/label'
import { DAY_LABELS } from '../constants'
import { DayOfWeek } from '@prisma/client'

interface DayItemProps {
  day: DayOfWeek
  today: string
  maxDays: number
  onToggle: (day: DayOfWeek, checked: boolean) => void
  selectedDays: DayOfWeek[]
}

export function DayItem({
  day,
  today,
  maxDays,
  onToggle,
  selectedDays,
}: DayItemProps) {
  return (
    <div
      key={day}
      className="relative flex flex-col items-center gap-2 border rounded-md px-4 py-6 max-w-[80px]"
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`day-${day}`}
          checked={selectedDays.includes(day)}
          onCheckedChange={(checked: boolean) => onToggle(day, checked)}
          disabled={
            !selectedDays.includes(day) && selectedDays.length >= maxDays
          }
        />
        <Label htmlFor={`day-${day}`} className="text-base cursor-pointer">
          {DAY_LABELS[day]}
        </Label>
      </div>

      {today === day && <Badge className="absolute bottom-0">Сегодня</Badge>}
    </div>
  )
}
