import { useMemo, useState } from "react"
import { addDays, format, startOfWeek } from "date-fns"
import { ru } from 'date-fns/locale'
import { DAY_KEYS } from "../constant"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { WarmUp } from "./warm-up"

export function DayTabs({
  weekNumber,
  programStart,
  currentDate,
}: {
  weekNumber: number
  programStart: Date
  currentDate: Date
}) {
  const weekStart = useMemo(
    () => addDays(programStart, (weekNumber - 1) * 7),
    [weekNumber, programStart]
  )

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), i)
      return {
        key: DAY_KEYS[i],
        label: format(date, 'ЕEE', { locale: ru }).slice(1,3),
        dateStr: format(date, 'd', { locale: ru }),
        date,
        isToday:
          format(date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
      }
    })
  }, [weekStart, currentDate])

  const defaultDayKey = days.find(d => d.isToday)?.key || 'mon'
  const [selectedDay, setSelectedDay] = useState(defaultDayKey)

  return (
    <Tabs
      value={selectedDay}
      onValueChange={setSelectedDay}
      className="space-y-2"
    >
      <TabsList className="flex gap-3 bg-transparent h-auto">
        {days.map(d => (
          <TabsTrigger
            key={d.key}
            value={d.key}
            className="rounded-md h-auto border  border-muted px-2 py-3 text-xs flex flex-col items-center flex-1  transition-colors data-[state=active]:bg-primary
    data-[state=active]:text-primary-foreground
    data-[state=active]:border-primary"
          >
            <span className='text-lg'>{d.label}</span>
            <span className="text-sm">
              {d.dateStr}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      {days.map(d => (
        <TabsContent key={d.key} value={d.key} className="flex flex-col gap-4">
          <WarmUp title={'Зарядка'} />
            <WarmUp title={'Тренировка'}/>
            
        </TabsContent>
      ))}
    </Tabs>
  )
}