export type EquipmentItem = {
  id: string
  title: string
  image?: string
  description: string
  replacement: string
  buy: {
    label: string
    href?: string
  }
}

export const equipmentItems: EquipmentItem[] = [
  {
    id: 'mat',
    title: 'Коврик для фитнеса',
    image: 'kovrik.png',
    description:
      'Нужен для устойчивости и комфорта в упражнениях на полу, защищает суставы и обеспечивает сцепление.',
    replacement: 'Заниматься на ковре без спортивного коврика.',
    buy: {
      label: 'Любой спортивный магазин или маркетплейсы',
    },
  },
  {
    id: 'pilates-band',
    title: 'Пилатес лента от 180 см',
    image: 'lenta-pilates.png',
    description:
      'Помогает включать мышцы мягко и без перегрузки, дает нужное сопротивление в упражнениях.',
    replacement: 'Пояс от халата или шарф.',
    buy: {
      label: 'Ozon или Wildberries',
      href: 'https://www.ozon.ru/',
    },
  },
  {
    id: 'mfr-roller',
    title: 'Роллер для МФР',
    description:
      'Мягкий роллер без ребер для работы с мышцами и фасциями, улучшает восстановление.',
    image: 'roll.png',
    replacement: 'Плотно свернутый валик из банного полотенца.',
    buy: {
      label: 'Любой спортивный магазин',
    },
  },
  {
    id: 'massage-balls',
    title: 'Мягкие массажные мячи (мячи Франклина), 2 шт.',
    image: 'balls_cutout_clean.png',
    description:
      'Используются для точечного массажа и снятия напряжения в мышцах.',
    replacement: 'Мяч для большого тенниса или детские шипованные мячи.',
    buy: {
      label: 'Маркетплейсы или магазин спортивных товаров',
    },
  },
  {
    id: 'pilates-ball',
    title: 'Мяч для пилатеса, d 25/50 см',
    image: 'ball-pilates.png',
    description:
      'Поддерживает стабильность и помогает включать глубокие мышцы корпуса.',
    replacement: 'Надувной детский мяч.',
    buy: {
      label: 'Детские товары или спортмагазин',
    },
  },
  {
    id: 'weights',
    title: 'Гантели/гири/набор разборных гантелей',
    image: 'dumbell.png',
    description: 'Нужны для силовых тренировок и прогрессии нагрузки.',
    replacement:
      'Тренироваться с собственным весом, 5 л бутыли с водой или книги в пакете.',
    buy: {
      label: 'Спортивные сети и маркетплейсы',
    },
  },
]
