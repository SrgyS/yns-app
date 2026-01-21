import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { getImageUrl } from '@/shared/lib/images'

const steps = [
  {
    title: 'Встреча с нутрициологом',
    text: 'Диагностика состояния и потребностей организма. Анкета + дневник питания и эмоционального состояния.',
  },
  {
    title: 'Создание индивидуального плана',
    text: 'Разработка персонального плана питания, учитывая ваш текущий рацион и поэтапное расширение рациона.',
  },
  {
    title: 'Регулярная поддержка',
    text: 'Еженедельные консультации для контроля прогресса и корректировки плана. Формат общения через Telegram, фото и аудио-сообщения.',
  },
]

const nutritionFix = [
  {
    title: 'Избавление от вредных привычек',
    text: 'Замена нездоровых продуктов на полезные аналоги.',
  },
  {
    title: 'Питательные вещества',
    text: 'Включение в рацион продуктов, богатых витаминами и минералами.',
  },
  {
    title: 'Нормализация пищевого поведения',
    text: 'Развитие устойчивых привычек для долгосрочного результата.',
  },
]

const monthPlan = [
  {
    title: 'Первая консультация',
    text: 'Обсуждение целей, анализ состояния и корректировка рациона. Поэтапный план витаминов и минералов.',
  },
  {
    title: 'Контроль и корректировка',
    text: 'Регулярные консультации для мониторинга прогресса и внесения изменений. Возможность продления по спец цене.',
  },
]

const issues = [
  'Избыточный вес, «сложно похудеть» и «не могу набрать вес».',
  'Недостаток питательных веществ: анемия, гипотериоз, слабость, апатия.',
  'Заболевания обмена веществ: корректировка питания при диабете и гипертонии.',
  'Проблемы с пищеварением: синдромы раздраженного кишечника, запоры, вздутия.',
  'Аллергии и непереносимость пищи: подбор альтернативных продуктов.',
  'Сердечно-сосудистые заболевания: снижение риска и поддержка сердца.',
  'Проблемы с кожей: акне, дерматит, псориаз, витилиго, перхоть.',
  'Проблемы с циклом: нерегулярность, СПКЯ, полипы, миомы, эндометриоз.',
  'Аутоиммунные заболевания: ревматоидный артрит, болезнь Бехтерева, целиакия.',
]

const analysisBlocks = [
  {
    title: 'Что включает анализ?',
    text: 'Определение причин недомогания, выявление дефицитов и дисбалансов.',
  },
  {
    title: 'Как проводится анализ?',
    list: [
      'Опрос',
      'Анализ дневника питания',
      'Фото/видео фиксация и анализ крови при необходимости',
    ],
  },
]

const plans = [
  {
    title: 'Изменения в рационе',
    text: 'Продукты с высоким содержанием питательных веществ.',
  },
  {
    title: 'Физическая активность',
    text: 'Подбор тренировок под вашу цель и состояние.',
  },
  {
    title: 'Управление стрессом',
    text: 'Практики восстановления и регулярности.',
  },
]

const tests = [
  {
    title: 'Биохимический анализ крови',
    text: 'Уровень витаминов, минералов и других показателей. Оценка функций органов.',
  },
  {
    title: 'Генетический анализ',
    text: 'Оценка генетических рисков и их коррекция.',
  },
]

const genetics = [
  {
    title: 'Генетическая предрасположенность',
    text: 'Определение особенностей метаболизма и реакции организма на пищу.',
  },
  {
    title: 'Непереносимость продуктов',
    text: 'Выявление индивидуальной чувствительности.',
  },
  {
    title: 'Рекомендации по активности',
    text: 'Оптимальный режим тренировок под задачи.',
  },
]

export default function NutritionSupport() {
  const heroImageUrl = getImageUrl('images', 'yns.png')

  return (
    <main className="flex flex-col gap-14">
      <section>
        <Card className="relative overflow-hidden rounded-4xl border-0 bg-muted/20 shadow-none pb-0">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-muted via-background/70 to-transparent z-0" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-muted via-muted/20 to-transparent z-0" />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] lg:grid-cols-2 gap-0 w-full max-w-7xl mx-auto relative z-10 xl:grid-cols-[1fr_0.7fr]">
            {/* Header */}
            <CardHeader className="order-1 md:col-start-1 md:row-start-1 pt-10 px-2 sm:px-6 md:pt-16 md:pl-10 md:pr-5 lg:pl-16 lg:pr-10">
              <Badge className="w-fit bg-primary/10 text-primary mb-2 sm:mb-6">
                Сопровождение нутрициолога
              </Badge>
              <div className="space-y-3 max-w-xl">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl md:text-4xl lg:text-5xl leading-tight">
                  Персональный план питания и восстановление организма
                </h1>
              </div>
            </CardHeader>

            {/* Photo */}
            <div className="relative  sm:mt-15 order-3 md:col-start-2 md:row-span-2 min-h-[300px] md:min-h-full w-full">
              <Image
                src={heroImageUrl}
                alt="Яна Степанова"
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Content */}
            <CardContent className="order-2 md:col-start-1 md:row-start-2 px-2 py-4 sm:p-6 md:pl-10 md:pb-16 md:pr-5 md:pt-0 lg:pl-16 lg:pr-10">
              <div className="flex flex-col gap-4 sm:gap-8 max-w-xl">
                <p className="text-sm text-muted-foreground md:text-lg leading-relaxed">
                  Индивидуальная программа на 2 месяца: диагностика, план
                  питания, поддержка и бонусная тренировка под ваши запросы.
                </p>
                <div className="flex flex-1 gap-3">
                  <Button
                    asChild
                    className="rounded-2xl text-xs sm:text-base sm:w-fit"
                  >
                    <Link
                      href="https://t.me/dominadara"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Оставить заявку
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-2xl text-xs sm:text-base bg-background/50 hover:bg-background/80 w-fit"
                    asChild
                  >
                    <Link href="/about">Познакомиться</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Индивидуальное сопровождение
          </h2>
          <p className="text-sm text-muted-foreground">
            Пошаговый процесс от диагностики до устойчивого результата.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="rounded-3xl p-0">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 text-primary grid place-items-center font-semibold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Коррекция питания
            </h2>
            <p className="text-sm text-muted-foreground">
              Работаем с причинами, а не симптомами — через понятные шаги.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {nutritionFix.map((item, index) => (
              <Card key={item.title} className="rounded-3xl p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
            <div className="rounded-3xl bg-muted/30 grid place-items-center text-sm text-muted-foreground">
              Изображение питания (заглушка)
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ведение 2 месяца
          </h2>
          <p className="text-sm text-muted-foreground">
            Две ключевые точки контроля прогресса и корректировок.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {monthPlan.map((item, index) => (
            <Card key={item.title} className="rounded-3xl p-0">
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Этап {index + 1}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="min-h-[300px] rounded-3xl bg-muted/30 grid place-items-center text-sm text-muted-foreground">
          Врач (заглушка)
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Анализ симптомов и состояния
            </h2>
            <p className="text-sm text-muted-foreground">
              Собираем данные и выстраиваем логику причин.
            </p>
          </div>
          <div className="grid gap-4">
            {analysisBlocks.map(block => (
              <Card key={block.title} className="rounded-3xl p-0">
                <CardContent className="space-y-3 p-4">
                  <div className="text-sm font-semibold">{block.title}</div>
                  {block.text ? (
                    <p className="text-sm text-muted-foreground">
                      {block.text}
                    </p>
                  ) : null}
                  {block.list ? (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {block.list.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Коррекция состояния
          </h2>
          <p className="text-sm text-muted-foreground">
            Решаем проблемы комплексно и системно.
          </p>
        </div>
        <Card className="rounded-3xl bg-muted/20 p-0">
          <CardContent className="p-4">
            <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              {issues.map(item => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Пошаговый план действий
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map(plan => (
            <Card key={plan.title} className="rounded-3xl p-0">
              <CardContent className="space-y-3 p-4">
                <div className="text-sm font-semibold">{plan.title}</div>
                <p className="text-sm text-muted-foreground">{plan.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Анализы и расшифровка по желанию
            </h2>
            <p className="text-sm text-muted-foreground">
              Анализы сдаются при возможности их провести.
            </p>
          </div>
          <div className="grid gap-3">
            {tests.map(test => (
              <Card key={test.title} className="rounded-3xl bg-muted/20 p-0">
                <CardContent className="space-y-2 p-4">
                  <div className="text-sm font-semibold">{test.title}</div>
                  <p className="text-sm text-muted-foreground">{test.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="min-h-[300px] rounded-3xl bg-muted/30 grid place-items-center text-sm text-muted-foreground">
          Документ (заглушка)
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Генетический тест по желанию
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {genetics.map(item => (
            <Card key={item.title} className="rounded-3xl p-0">
              <CardContent className="space-y-3 p-4">
                <div className="h-12 w-12 rounded-2xl bg-secondary grid place-items-center text-xs text-foreground">
                  Icon
                </div>
                <div className="text-sm font-semibold">{item.title}</div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-4xl bg-foreground text-background p-4 sm:p-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Бонусная программа на выбор на 2 месяца
            </h2>
            <p className="text-sm opacity-80">
              Примеры программ: «Перезагрузка движений», «Тело без отеков»,
              «Детоксикация организма».
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-2xl bg-background text-foreground hover:bg-background/90"
            >
              <Link
                href="https://t.me/dominadara"
                target="_blank"
                rel="noopener noreferrer"
              >
                Записаться на консультацию
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl text-foreground"
              asChild
            >
              <Link href="/about">Подробнее</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
