'use client'

import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu'
import { Button } from '@/shared/ui/button'
import { ChevronDown } from 'lucide-react'
import { UserCourseEnrollmentApi } from '@/entity/course'

interface CourseSelectorProps {
  enrollments: UserCourseEnrollmentApi[]
  selectedEnrollmentId: string
  onEnrollmentChange: (enrollmentId: string) => void
}

export function CourseSelector({ enrollments, selectedEnrollmentId, onEnrollmentChange }: CourseSelectorProps) {
  const selectedEnrollment = enrollments.find(e => e.id === selectedEnrollmentId) || enrollments[0]

  if (enrollments.length <= 1) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Выберите курс:</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedEnrollment ? `Курс ${selectedEnrollment.courseId}` : 'Выберите курс'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full">
          {enrollments.map((enrollment) => (
            <DropdownMenuItem 
              key={enrollment.id} 
              onClick={() => onEnrollmentChange(enrollment.id)}
            >
              Курс {enrollment.courseId}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 