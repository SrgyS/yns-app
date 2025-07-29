'use client'

import { useState } from 'react'
import { differenceInCalendarWeeks, format } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { DayTabs } from './day-tabs'
import { WEEKS } from '../constant'
import { ru } from 'date-fns/locale'

export function CalendarTabs() {
  const today = new Date()
  const programStart = new Date('2025-07-15') // ← заменить на реальную дату старта курса

  const currentWeekIndex = Math.min(
    Math.max(
      differenceInCalendarWeeks(today, programStart, { weekStartsOn: 1 }) + 1,
      1
    ),
    4
  )

  const [selectedWeek, setSelectedWeek] = useState(`week-${currentWeekIndex}`)

  return (
    <div className='flex flex-col gap-2 font-bold w-full'>
      <h3>{format(today, 'LLLL', { locale: ru })}</h3>
      <Tabs
        value={selectedWeek}
        onValueChange={setSelectedWeek}
        className="space-y-4"
      >
        <TabsList className="rounded-lg bg-muted p-1 grid grid-cols-4">
          {WEEKS.map(w => (
            <TabsTrigger
              key={w}
              value={`week-${w}`}
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
            >
              Неделя {w}
            </TabsTrigger>
          ))}
        </TabsList>

        {WEEKS.map(w => (
          <TabsContent key={w} value={`week-${w}`}>
            <DayTabs
              weekNumber={w}
              programStart={programStart}
              currentDate={today}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
