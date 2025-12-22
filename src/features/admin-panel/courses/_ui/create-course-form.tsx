'use client'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Form } from '@/shared/ui/form'
import { Spinner } from '@/shared/ui/spinner'
import { useRouter } from 'next/navigation'

import { useCourseForm } from './model/use-course-form'
import { GeneralInfoSection } from './form-parts/general-info-section'
import { MediaSection } from './form-parts/media-section'
import { AccessSection } from './form-parts/access-section'
import { ScheduleSection } from './form-parts/schedule-section'
import { WeeksManager } from './form-parts/weeks-manager'
import { CourseContentType } from '@prisma/client'

type CreateCourseFormProps = {
  editSlug?: string
}

export function CreateCourseForm({
  editSlug,
}: Readonly<CreateCourseFormProps>) {
  const router = useRouter()
  const { form, onSubmit, isSubmitting, isLoadingPrefill, courseId, courseQuery } =
    useCourseForm(editSlug)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {courseId ? 'Редактирование курса' : 'Создание нового курса'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <GeneralInfoSection
              control={form.control}
              disabled={isSubmitting || isLoadingPrefill}
            />

            <MediaSection
              control={form.control}
              disabled={isSubmitting || isLoadingPrefill}
            />

            <ScheduleSection
              control={form.control}
              disabled={isSubmitting || isLoadingPrefill}
            />

            <AccessSection
              control={form.control}
              disabled={isSubmitting || isLoadingPrefill}
              initialContentType={
                courseQuery.data?.contentType as CourseContentType | undefined
              }
            />

            <WeeksManager
              control={form.control}
              disabled={isSubmitting || isLoadingPrefill}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting || isLoadingPrefill}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoadingPrefill}>
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                {courseId ? 'Сохранить и далее' : 'Далее'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
