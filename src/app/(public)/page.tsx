import { CoursesList } from '@/features/courses-list/courses-list'
import { Card, CardContent } from '@/shared/ui/card'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
export default async function Home() {
  return (
    <main className="container flex min-h-screen flex-col p-8">
      <Card className="bg-gradient-to-r from-slate-300 to-slate-500">
        <CardContent>
          <span className="text-xs sm:text-xl text-neutral-800">
            ОНЛАЙН ФИТНЕС-КЛУБ
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold font-inter pb-3 text-neutral-800">
            YA·NA·SPORTE
          </h1>
          <span className="text-base sm:text-lg text-neutral-800">
            Тренировки, которые ты любишь. Результаты, которые ты видишь.
          </span>
        </CardContent>
      </Card>
      <h1 className="text-2xl font-bold mb-6">Курсы</h1>
      <CoursesList />
    </main>
  )
}
