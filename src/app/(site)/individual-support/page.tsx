import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

const infoBlocks = [
  {
    title: 'Что входит в сопровождение',
    text: '3 персональные консультации, разбор анализов и состояния, понятный план действий на 1–2 месяца и сопровождение между встречами.',
  },
  {
    title: 'Как проходит работа',
    text: 'Мы начинаем с диагностики и уточнения задачи, затем собираем систему: питание, движение, восстановление и поддержка по самочувствию.',
  },
  {
    title: 'Для кого подойдет',
    text: 'Если вы уже пробовали разные подходы, но результат нестабилен или откатывается, и нужен персональный разбор причин.',
  },
]

export default function IndividualSupportPage() {
  return (
    <main className="flex flex-col gap-10 py-17">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="order-2 space-y-4 lg:order-1">
          <Badge className="w-fit bg-primary/10 text-primary">
            Индивидуальное сопровождение
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
            Персональная работа с фокусом на причины
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Формат для глубокого разбора ваших запросов: питание, состояние,
            ограничения, привычки и устойчивые изменения в ритме жизни.
          </p>
        </div>
        <div className="order-1 lg:order-2">
          <div className="flex aspect-4/3 items-center justify-center rounded-3xl bg-muted/30 text-sm text-muted-foreground">
            Фото (заглушка)
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {infoBlocks.map(block => (
          <Card key={block.title} className="rounded-3xl">
            <CardContent className="space-y-2 p-5">
              <h2 className="text-lg font-semibold">{block.title}</h2>
              <p className="text-sm text-muted-foreground">{block.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild className="rounded-2xl">
          <Link href="/apply">Оставить заявку</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-2xl">
          <Link href="/about">Подробнее о Яне</Link>
        </Button>
      </section>
    </main>
  )
}
