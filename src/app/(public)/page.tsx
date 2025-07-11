import { CoursesList } from '@/features/courses-list/courses-list'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-bold mb-6">Курсы</h1>
      <CoursesList />
    </main>
  )
}
