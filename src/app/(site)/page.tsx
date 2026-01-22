import { getImageUrl } from '@/shared/lib/images'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/shared/ui/dialog'
// import { Separator } from '@/shared/ui/separator'
import React from 'react'
import Image from 'next/image'
import { CoursesList } from '@/features/courses-list/courses-list'
import { HeroSection } from './_components/hero-section'
// import { ServiceCard } from './_components/service-card'
import Link from 'next/link'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import {
  Award,
  ClipboardCheck,
  Dna,
  GraduationCap,
  MonitorSmartphone,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const accordionItems = [
  {
    title: 'Где проходит общение с Яной и участницами курса?',
    content:
      'Все общение и поддержка проходят в Telegram. На курсе «Красота и здоровье» чат доступен только на тарифе «Премиум».',
  },
  {
    title: 'Можно ли заниматься дома или только в зале?',
    content:
      'Тренироваться можно как в зале, так и дома. Для домашних тренировок потребуется дополнительное оборудование.',
  },
  {
    title: 'Если я живу в другом часовом поясе, будет ли это проблемой?',
    content:
      'Все тренировки уже записаны, поэтому вы можете заниматься в любое удобное для вас время, независимо от часового пояса.',
  },
  {
    title: 'Можно ли участвовать в курсе во время беременности?',
    content:
      'Да, возможно. Для беременных предусмотрен отдельный курс с адаптированными тренировками. Перед началом занятий важно проконсультироваться с врачом, который ведет беременность.',
  },
  {
    title: 'Какое оборудование нужно для занятий дома?',
    content:
      'Список необходимого оборудования и рекомендации по выбору доступны в отдельном блоке «Оборудование для курса» на странице программы.',
  },
  {
    title: 'Есть ли ограничения по здоровью или травмам?',
    content:
      'При наличии хронических заболеваний или травм рекомендуется предварительно проконсультироваться с врачом. Для более безопасного и индивидуального подхода лучше выбрать тариф с обратной связью от Яны или формат персональной работы.',
  },
]

const faqColumns = [
  accordionItems.filter((_, index) => index % 2 === 0),
  accordionItems.filter((_, index) => index % 2 === 1),
]

export default function Home() {
  const trainingImageUrl = getImageUrl('images', 'move.webp')
  const relaxImageUrl = getImageUrl('images', 'relax.jpg')
  const nutritionImageUrl = getImageUrl('images', 'yana-4-3-2.png')
  const aboutImgeUrl = getImageUrl('images', 'about-yana.png')
  // const heroImageUrl = getImageUrl('images', '932A0174.jpg')
  const individualSupportItems = [
    {
      key: 'consultation',
      title: 'Консультация онлайн',
      description:
        'Комплексный разбор, который по факту заменяет несколько консультаций у разных специалистов: вы получаете целостную картину и план действий на 1–2 месяца.',
      price: { currency: '₽', value: '20 000' },
      icon: MonitorSmartphone,
      bullets: [
        'Онлайн-созвон 60–90 минут: понятно, без «медицинского тумана», с логикой причин',
      ],
      dialogText:
        'Старый текст: Если вы не готовы сдавать анализы и хотите со мной пообщаться на интересующие вас темы - и узнать персонализированный подход к вашему телу и здоровью - я готова помочь в формате устной беседы онлайн - 55 минут. НОВЫЙ: Онлайн-встреча для разбора вашего запроса, причин и ограничений. Вы получите понятный план действий и рекомендации, которые реально встроить в жизнь.',
      footer: true,
    },
    {
      key: 'individual-support',
      title: 'Индивидуальное сопровождение',
      description:
        '3 персональных консультации для разбора ваших трудностей, анализов, вопросов здоровья, питания, движения',
      price: { currency: '₽', value: '60 000' },
      icon: UserRoundCheck,
      bullets: ['3 персональных консультации', 'План действий на 1–2 месяца'],
      dialogText:
        'Формат для более глубокой работы: разбор анализов, питания, движения и состояния, регулярная связь и корректировки по ходу сопровождения.',
      footer: true,
      href: '/individual-support',
    },
    {
      key: 'nutrition-support',
      title: 'Сопровождение нутрициолога',
      description:
        'Глубокая диагностика, индивидуальный план и системное восстановление тела. Для тех, кто хочет разобраться в причине симптомов и настроить питание, нутрицевтики и образ жизни под себя',
      price: { currency: '₽', value: '60 000' },
      icon: ClipboardCheck,
      bullets: [
        '3 персональных консультации с нутрициологом',
        'Индивидуальный план питания и образа жизни',
      ],
      footer: true,
      href: '/nutrition-support',
    },
  ]
  const aboutFacts = [
    {
      title: '10+ лет практики',
      description: 'Опыт работы тренером и онлайн-специалистом',
      icon: Award,
    },
    {
      title: 'Дипломированный нутрициолог',
      description: 'Профессиональное образование по нутрициологии',
      icon: GraduationCap,
    },
    {
      title: 'Генетика и анализы',
      description:
        'Прошла обучение по расшифровке лабораторных и генетических тестов',
      icon: Dna,
    },
    {
      title: '1000+ клиентов',
      description: 'Реальные истории изменений и устойчивые результаты',
      icon: UsersRound,
    },
  ]

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <HeroSection />

      {/* For who */}
      <section className="py-7 sm:py-14">
        <div className="mb-6 sm:mb-8 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Если вы узнаете себя, значит вам нужна не мотивация, а{' '}
            <span className="text-primary font-bold">система</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-12">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                {
                  t: 'Вес или объемы стоят',
                  d: 'Даже когда вы стараетесь и контролируете.',
                },
                {
                  t: 'Отеки и тяжесть',
                  d: 'Лицо, живот, чувство расплывшегося тела.',
                },
                {
                  t: 'Рыхлость',
                  d: 'Тело не держит форму, хочется плотности.',
                },
                {
                  t: 'Сон и стресс',
                  d: 'Нет ресурса, тянет на сладкое, качели.',
                },
                {
                  t: 'Тренировки есть, результата нет',
                  d: 'Скорее нужна структура, а не больше нагрузки.',
                },
                {
                  t: 'Опыт диет',
                  d: 'Чем жестче контроль, тем сильнее откат.',
                },
              ].map(x => (
                <Card
                  key={x.t}
                  className="rounded-2xl shadow-none bg-primary/10"
                >
                  <CardContent className="px-4">
                    <div className="text-sm font-medium">{x.t}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {x.d}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why not works */}
      <section className="py-7 sm:py-14">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Чаще всего мешает не сила воли, а{' '}
              <span className="text-primary font-bold">
                неправильная точка приложения
              </span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Если вы усиливаете давление на себя, тело часто отвечает
              отечностью, срывами и усталостью.
            </p>
          </div>
          <div className="md:col-span-7">
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="p-6">
                <ul className="space-y-3 text-sm">
                  {[
                    'Усиливают тренировки, когда телу нужно восстановление и базовые привычки.',
                    'Урезают еду, когда проблема в регулярности, белке и стрессе.',
                    'Прыгают между методиками, когда нужен план на недели и прогрессия.',
                    'Лечат последствия, не меняя ежедневный ритм тела.',
                  ].map(t => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      <span className="text-foreground/90">{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl bg-muted/35 p-5 border">
                  <div className="mt-1 text-sm text-muted-foreground">
                    Стабильные изменения начинаются с базовых действий, которые
                    повторяются регулярно, как гигиена.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* System */}
      <section id="system" className="py-7 sm:py-14">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight  mb-6 sm:mb-8">
          Моя методика строится <br /> на{' '}
          <span className="text-primary font-bold">трех опорах</span>
        </h2>
        <Card className="rounded-4xl bg-card text-card-foreground flex-1 pb-2 px-0 pt-0 shadow-lg border-none">
          <CardContent className="p-0">
            <div className="grid gap-2 lg:grid-cols-[1fr_4fr]">
              <div className="flex flex-col justify-between p-6">
                <p className="text-sm text-muted-foreground mt-3">
                  Это не про держаться. Это про понять, как работает тело, и
                  дать ему инструменты.
                </p>
                <div className="text-sm text-muted-foreground mt-3">
                  Формат: видео-тренировки + структура питания + восстановление
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3 sm:grid-cols-2 p-2">
                {[
                  {
                    k: '1',
                    t: 'Движение',
                    d: 'Тренировки, которые улучшают осанку, дыхание, тонус и лимфодренаж. Без жести, но с прогрессией.',
                    img: trainingImageUrl,
                  },
                  {
                    k: '2',
                    t: 'Питание',
                    d: 'Не диета, а структура. Регулярность, белок, устойчивые жиры, меньше перекусов, меньше воспаления.',
                    img: nutritionImageUrl,
                  },
                  {
                    k: '3',
                    t: 'Восстановление',
                    d: 'Сон, стресс, дыхание, регулярность. Тело не меняется на кортизоле, и это учитывается в плане.',
                    img: relaxImageUrl,
                  },
                ].map(x => (
                  <Card
                    key={x.t}
                    className="rounded-3xl shadow-sm p-0 overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="relative min-h-60 md:min-h-72">
                        {x.img ? (
                          <Image
                            src={x.img}
                            alt="block image"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 360px"
                          />
                        ) : null}
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/85 via-black/50 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-between h-full p-4 lg:pb-6 lg:px-4  text-white">
                          <Badge className="text-lg font-semibold bg-background/70 text-secondary-foreground">
                            {x.t}
                          </Badge>
                          <p className="text-sm text-white/90">{x.d}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Card className="rounded-3xl bg-primary/10 text-foreground mx-2 mt-8 md:mt-10">
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-sm font-bold">
                    Почему это работает в долгую
                  </div>
                  <div className="text-sm mt-1">
                    В программах есть инструменты, которые помогают изменить
                    привычки, и та проблема, с которой пришёл человек, уходит.
                  </div>
                </div>
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-background text-foreground hover:bg-background/90"
                >
                  <a href="#programs">Выбрать программу</a>
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>

      <section id="programs" className="py-7 sm:py-14">
        <div className="flex flex-col justify-between pb-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Выберите <span className="text-primary font-bold">курс</span> <br />{' '}
            под свои цели
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Если сомневаетесь, начните с мягкого старта. Затем можно перейти в
            клуб и закрепить регулярность.
          </p>
        </div>
        <CoursesList />
      </section>

      {/* Individual Support */}
      <section id="individual" className="py-7 sm:py-14">
        <div className="space-y-4">
          <h2 className="font-montserrat text-2xl font-semibold sm:text-3xl">
            <span className="text-primary font-bold">Индивидуальная</span>{' '}
            работа
          </h2>
          <div className="bg-primary/10 rounded-3xl p-2">
            <div className="flex items-center p-2 flex-wrap gap-2">
              {' '}
              <Badge className="w-fit" variant="secondary">
                дистанционно
              </Badge>
              <Badge className="w-fit" variant="secondary">
                персональный разбор
              </Badge>
            </div>
            <p className="text-muted-foreground px-2 py-4 sm:py-6">
              Формат для тех, кому не подходят общие рекомендации и стандартные
              схемы. Если вы уже многое пробовали, но состояние не улучшается
              или результат постоянно откатывается, здесь важен персональный
              разбор и понимание причин. В работе учитываются особенности тела,
              анализы и образ жизни, чтобы подобрать индивидуальные рекомендации
              и выстроить программу, которая реально вписывается в жизнь и даёт
              устойчивый результат.
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              {individualSupportItems.map(item => {
                const Icon = item.icon
                const bullets = item.bullets?.filter(Boolean) ?? []

                return (
                  <Card key={item.key} className="justify-between rounded-3xl">
                    <CardHeader>
                      <div className="flex justify-between gap-2 mb-4">
                        <h3 className="text-xl sm:text-2xl font-semibold">
                          {item.title}
                        </h3>
                        <div className="flex align-center justify-center bg-primary/10 p-2 sm:p-3 rounded-2xl w-10 h-10 sm:w-14 sm:h-14">
                          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary/80" />
                        </div>
                      </div>

                      <p>{item.description}</p>
                      <div className="flex gap-1.5 pt-2">
                        <span className="text-lg font-medium">
                          {item.price.currency}
                        </span>
                        <span className="font-semibold text-4xl">
                          {item.price.value}
                        </span>
                      </div>
                    </CardHeader>
                    <div className="px-4">
                      <Separator />
                    </div>
                    <CardContent>
                      {bullets.length ? (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {bullets.map(bullet => (
                            <li key={bullet} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </CardContent>
                    {item.footer ? (
                      <CardFooter>
                        <div className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          {item.href ? (
                            <Button
                              variant="outline"
                              className="rounded-2xl"
                              asChild
                            >
                              <Link href={item.href}>Подробнее</Link>
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="rounded-2xl"
                                >
                                  Подробнее
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>{item.title}</DialogTitle>
                                  <DialogDescription>
                                    {item.dialogText}
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="sm:justify-between">
                                  <DialogClose asChild>
                                    <Button
                                      variant="outline"
                                      className="rounded-2xl"
                                    >
                                      Назад
                                    </Button>
                                  </DialogClose>
                                  <Button asChild className="rounded-2xl">
                                    <a href="/apply">Оставить заявку</a>
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button
                            asChild
                            className="w-full sm:w-auto rounded-2xl"
                          >
                            <a href="/apply">Оставить заявку</a>
                          </Button>
                        </div>
                      </CardFooter>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24 py-7 sm:py-14">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6">
          О тренере и создателе <br /> ya·na·sporte{' '}
          <span className="text-primary font-bold">online</span>
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8 lg:gap-10">
          {/* Фото */}
          <div className="order-1 md:order-2 md:col-span-5 lg:col-span-6 lg:row-span-2">
            <div className="relative shadow-sm h-full w-full overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 md:aspect-auto md:min-h-[360px]">
              <Image
                src={aboutImgeUrl}
                alt="Яна Степанова"
                fill
                className="object-cover object-[center_20%] md:object-center"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 40vw, 520px"
              />
            </div>
          </div>

          {/* О Яне */}
          <Card className="order-2 md:order-1 md:col-span-7 lg:col-span-6 rounded-3xl bg-background/80 shadow-sm">
            <CardContent>
              <p className="text-lg font-semibold">Яна Степанова</p>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Эксперт по работе с телом, питанием и восстановлением. Помогаю
                выстроить систему, которая даёт результат без крайностей, с
                учётом физиологии, образа жизни и реальных ограничений. Работаю
                не с симптомами, а с причинами, чтобы изменения были устойчивыми
                и долгосрочными.
              </p>
              <div className="mt-5">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/about">Подробнее о Яне</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Факты */}
          <Card className="order-3 md:col-span-12 lg:col-span-6 rounded-3xl bg-background/80 shadow-sm p-0">
            <CardContent className="space-y-4 p-2 sm:p-4">
              {aboutFacts.map(item => {
                const Icon = item.icon

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 bg-muted/40 rounded-3xl p-2 sm:p-4"
                  >
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-7 sm:py-14">
        <div className="flex flex-col gap-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Ответы на вопросы
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {faqColumns.map((items, columnIndex) => (
              <Accordion
                key={`faq-col-${columnIndex}`}
                type="single"
                collapsible
                className="w-full"
              >
                {items.map((item, index) => (
                  <AccordionItem
                    className="border-b-primary/30"
                    key={item.title}
                    value={`item-${columnIndex}-${index + 1}`}
                  >
                    <AccordionTrigger className="text-base">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {item.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + Quiz */}
      <section id="cta" className="pt-7 sm:pt-14">
        <Card className="rounded-3xl bg-foreground text-background shadow-sm overflow-hidden">
          <CardContent className="p-8 md:p-10">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-7">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Начните с правильной точки входа
                </h2>
                <p className="mt-3 text-sm opacity-80 max-w-xl">
                  Я помогу выбрать программу под вашу задачу и ограничения.
                  Достаточно коротко описать ситуацию.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="h-12 rounded-2xl bg-background text-foreground hover:bg-background/90"
                  >
                    <a href="#programs">Выбрать программу</a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-2xl border-white/20 bg-transparent text-background hover:bg-white/10 hover:text-secondary"
                  >
                    <Link href="https://t.me/YanasporteOnline">
                      Написать в Telegram
                    </Link>
                  </Button>
                </div>
              </div>

              {/* <div className="md:col-span-5">
                  <div className="rounded-3xl bg-white/8 border border-white/10 p-4 sm:p-5">
                    <QuizCard />
                  </div>
                </div> */}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
