import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

const equipmentItems = [
  {
    title: 'Коврик для фитнеса',
    description:
      'Нужен для устойчивости и комфорта в упражнениях на полу, защищает суставы и обеспечивает сцепление.',
    replacement: 'Заниматься на ковре без спортивного коврика.',
    buy: {
      label: 'Любой спортивный магазин или маркетплейсы',
    },
  },
  {
    title: 'Пилатес лента от 180 см',
    description:
      'Помогает включать мышцы мягко и без перегрузки, дает нужное сопротивление в упражнениях.',
    replacement: 'Пояс от халата или шарф.',
    buy: {
      label: 'Ozon или Wildberries',
      href: 'https://www.ozon.ru/',
    },
  },
  {
    title: 'Роллер для МФР',
    description:
      'Мягкий роллер без ребер для работы с мышцами и фасциями, улучшает восстановление.',
    replacement: 'Плотно свернутый валик из банного полотенца.',
    buy: {
      label: 'Любой спортивный магазин',
    },
  },
  {
    title: 'Мягкие массажные мячи (мячи Франклина), 2 шт.',
    description:
      'Используются для точечного массажа и снятия напряжения в мышцах.',
    replacement: 'Мяч для большого тенниса или детские шипованные мячи.',
    buy: {
      label: 'Маркетплейсы или магазин спортивных товаров',
    },
  },
  {
    title: 'Мяч для пилатеса, d 25/50 см',
    description:
      'Поддерживает стабильность и помогает включать глубокие мышцы корпуса.',
    replacement: 'Надувной детский мяч.',
    buy: {
      label: 'Детские товары или спортмагазин',
    },
  },
  {
    title: 'Гантели/гири/набор разборных гантелей',
    description:
      'Нужны для силовых тренировок и прогрессии нагрузки.',
    replacement:
      'Тренироваться с собственным весом, 5 л бутыли с водой или книги в пакете.',
    buy: {
      label: 'Спортивные сети и маркетплейсы',
    },
  },
]

export default function EquipmentPage() {
  return (
    <section className="flex flex-col gap-8 pt-14 pb-10">
      <div className="space-y-3">
        <Badge className="w-fit" variant="secondary">
          Оборудование
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
          Оборудование для тренировок
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base max-w-2xl">
          Собрали список оборудования для занятий и варианты замены, если сейчас
          нет возможности купить инвентарь.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {equipmentItems.map(item => (
          <Card key={item.title} className="rounded-3xl overflow-hidden">
            <div className="flex aspect-4/3 items-center justify-center bg-muted/30 text-sm text-muted-foreground">
              Изображение (заглушка)
            </div>
            <CardHeader className="space-y-3">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Чем заменить</p>
                <p className="text-sm text-muted-foreground">
                  {item.replacement}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Где купить</p>
                {item.buy.href ? (
                  <Link
                    href={item.buy.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {item.buy.label}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {item.buy.label}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </section>
  )
}
