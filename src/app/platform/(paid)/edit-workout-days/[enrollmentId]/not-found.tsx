import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Курс не найден</h1>
        <p className="mt-4">У вас нет доступных курсов</p>
        <div className="mt-6">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Перейти к выбору курса
          </Link>
        </div>
      </div>
    </section>
  )
}
