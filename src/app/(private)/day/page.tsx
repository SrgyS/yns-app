import { CalendarTabs } from '@/features/practice/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'

export default function DayPage() {
  return (
    <main className="flex flex-col justify-centerspace-y-6 py-14 container  max-w-[600px]">
      <CalendarTabs />
      <Button variant="outline">Варианты питания</Button>
    </main>
  )
}
