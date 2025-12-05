import { DailyPlanEditor } from '@/features/admin-panel/courses/_ui/daily-plan-editor'

type DailyPlanPageProps = {
  params?: Promise<{ slug: string }>
}

export default async function CourseDailyPlanPage({
  params,
}: DailyPlanPageProps) {
  const resolvedParams = params ? await params : { slug: '' }
  return <DailyPlanEditor slug={resolvedParams.slug} />
}
