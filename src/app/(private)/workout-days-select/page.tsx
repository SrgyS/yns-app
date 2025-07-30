'use client'
import { WorkoutDaySelector } from "@/features/select-training-days/_ui/workout-day-selector";
import { DayOfWeek } from "@prisma/client";

export default function SelectTrainingDays() {
  const handleDaysSelection = (selectedDays: DayOfWeek[]) => {
    // Здесь можно обработать выбранные дни, например, отправить на сервер
    console.log("Выбранные дни:", selectedDays);
  };
  
  return (
    <main className="flex flex-col justify-centerspace-y-6 py-14 container  max-w-[800px]">
     <WorkoutDaySelector    onSelectDays={handleDaysSelection}
        minDays={5}
        maxDays={5}
        isLoading={false} />
    </main>
  )
}
