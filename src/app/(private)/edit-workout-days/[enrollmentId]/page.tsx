'use client'
import { useParams } from "next/navigation";
import { EditWorkoutDays } from "@/features/select-training-days/_ui/edit-workout-days";
import { useUpdateWorkoutDays } from "@/features/select-training-days/_vm/use-update-workout-days";
import { useCourseEnrollment } from "@/features/course-enrollment/_vm/use-course-enrollment";
import { DayOfWeek } from "@prisma/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditWorkoutDaysPage() {
  const { enrollmentId } = useParams();
  const { updateWorkoutDays, isUpdating } = useUpdateWorkoutDays();
  const { getEnrollmentById } = useCourseEnrollment();
  const [currentSelectedDays, setCurrentSelectedDays] = useState<DayOfWeek[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const enrollmentQuery = getEnrollmentById(enrollmentId as string);

  useEffect(() => {
    if (enrollmentQuery.data) {
      setCurrentSelectedDays(enrollmentQuery.data.selectedWorkoutDays);
      setIsLoading(false);
    } else if (enrollmentQuery.error) {
      console.error('Error loading enrollment:', enrollmentQuery.error);
      toast.error('Ошибка при загрузке данных');
      setIsLoading(false);
    }
  }, [enrollmentQuery.data, enrollmentQuery.error]);

  const handleUpdateDays = async (selectedDays: DayOfWeek[]) => {
    try {
      await updateWorkoutDays({
        enrollmentId: enrollmentId as string,
        selectedWorkoutDays: selectedDays,
      });
      
      // Обновляем локальное состояние
      setCurrentSelectedDays(selectedDays);
    } catch (error) {
      console.error('Error updating workout days:', error);
    }
  };

  if (isLoading) {
    return (
      <main className="flex flex-col justify-center items-center space-y-6 py-14 container max-w-[800px]">
        <div className="text-center">
          <p>Загрузка...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <EditWorkoutDays
        currentSelectedDays={currentSelectedDays}
        onUpdateDays={handleUpdateDays}
        minDays={5}
        maxDays={5}
        isLoading={isUpdating}
      />
    </main>
  );
} 