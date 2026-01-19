import { getImageUrl } from '@/shared/lib/images'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card'
// import { Separator } from '@/shared/ui/separator'
import React from 'react'
import Image from 'next/image'
import { CoursesList } from '@/features/courses-list/courses-list'
import { HeroSection } from './_components/hero-section'
// import { ServiceCard } from './_components/service-card'
import Link from 'next/link'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { ClipboardCheck, MonitorSmartphone, UserRoundCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

// type QuizOptionValue =
//   | 'edema'
//   | 'belly'
//   | 'loose'
//   | 'pain'
//   | 'new'
//   | 'mid'
//   | 'fit'
//   | 'solo'
//   | 'support'

// type QuizAnswer = '' | QuizOptionValue

// type Recommendation = {
//   title: string
//   reason: string
//   href: string
//   tag: string
// }

// type QuizOption = {
//   value: QuizOptionValue
//   label: string
// }

// type QuizQuestion = {
//   label: string
//   options: QuizOption[]
// }

// type QuizConfig = {
//   q1: QuizQuestion
//   q2: QuizQuestion
//   q3: QuizQuestion
// }

// type RecommendationInput = {
//   q1: QuizAnswer
//   q2: QuizAnswer
//   q3: QuizAnswer
// }

// const quiz: QuizConfig = {
//   q1: {
//     label: 'Что сейчас беспокоит больше всего',
//     options: [
//       { value: 'edema', label: 'отеки и тяжесть' },
//       { value: 'belly', label: 'живот и расплывшиеся линии' },
//       { value: 'loose', label: 'рыхлость и отсутствие плотности' },
//       { value: 'pain', label: 'боль, ограничения по спине, коленям' },
//     ],
//   },
//   q2: {
//     label: 'Ваш текущий уровень тренированности',
//     options: [
//       { value: 'new', label: 'давно не занималась или возвращаюсь после паузы' },
//       { value: 'mid', label: 'занимаюсь иногда, но нерегулярно' },
//       { value: 'fit', label: 'занимаюсь регулярно, хочу лучше результат' },
//     ],
//   },
//   q3: {
//     label: 'Формат, который вам подходит',
//     options: [
//       { value: 'solo', label: 'хочу самостоятельно' },
//       { value: 'support', label: 'хочу поддержку и сопровождение' },
//     ],
//   },
// }

// const quizOptionValues = new Set<QuizOptionValue>([
//   'edema',
//   'belly',
//   'loose',
//   'pain',
//   'new',
//   'mid',
//   'fit',
//   'solo',
//   'support',
// ])

// function isQuizOptionValue(value: string): value is QuizOptionValue {
//   return quizOptionValues.has(value as QuizOptionValue)
// }

// function normalizeRec({
//   title,
//   reason,
//   href,
//   tag,
// }: Partial<Recommendation>): Recommendation {
//   return {
//     title: title || 'Программа',
//     reason: reason || 'Подберем точку входа под вашу задачу и ограничения.',
//     href: href || '#programs',
//     tag: tag || 'рекомендация',
//   }
// }

// type RadioCardsProps = {
//   name: string
//   value: QuizAnswer
//   options: QuizOption[]
//   onChange: (value: QuizOptionValue) => void
// }

// function RadioCards(props: RadioCardsProps) {
//   return (
//     <div className="grid gap-3 sm:grid-cols-2">
//       {props.options.map(o => {
//         const active = props.value === o.value
//         return (
//           <label
//             key={o.value}
//             className={
//               'cursor-pointer rounded-2xl border bg-card p-4 transition hover:bg-muted/40 ' +
//               (active ? 'ring-2 ring-ring' : '')
//             }
//           >
//             <input
//               className="sr-only"
//               type="radio"
//               name={props.name}
//               value={o.value}
//               checked={active}
//               onChange={e => {
//                 if (isQuizOptionValue(e.target.value)) {
//                   props.onChange(e.target.value)
//                 }
//               }}
//             />
//             <div className="text-sm font-medium">{o.label}</div>
//           </label>
//         )
//       })}
//     </div>
//   )
// }

// function getRecommendation(input: RecommendationInput): Recommendation {
//   const { q1, q2, q3 } = input

//   if (q1 === 'pain' || q2 === 'new') {
//     return normalizeRec({
//       title: 'Перезагрузка движений',
//       reason:
//         q3 === 'support'
//           ? 'Лучший старт, когда есть ограничения, страх нагрузки или пауза. Мягкая прогрессия, работа с осанкой и дыханием.'
//           : 'Самостоятельный формат подойдет, если вы готовы идти по плану без чата, но хотите системную базу и понятную прогрессию.',
//       href: '/programs/perezagruzka',
//       tag: q3 === 'support' ? 'мягкий старт' : 'самостоятельно',
//     })
//   }

//   if (q1 === 'edema' && q3 === 'support') {
//     return normalizeRec({
//       title: 'Тело без отеков',
//       reason:
//         'Если отечность и тяжесть основная жалоба, формат с питанием и сопровождением дает быстрее стабильность и меньше откатов.',
//       href: '/programs/noedema',
//       tag: 'с сопровождением',
//     })
//   }

//   if (q3 === 'solo' && (q1 === 'pain' || q1 === 'belly')) {
//     return normalizeRec({
//       title: 'Осанка без боли и стресса',
//       reason:
//         'Подойдет, если вы хотите сфокусироваться на качестве движения, разгрузке шеи и спины, и заниматься самостоятельно.',
//       href: '/programs/posture',
//       tag: 'только тренировки',
//     })
//   }

//   if (q1 === 'loose') {
//     return normalizeRec({
//       title: q3 === 'support' ? 'Тело без отеков' : 'Перезагрузка движений',
//       reason:
//         q3 === 'support'
//           ? 'Рыхлость часто держится на сочетании питания, стресса и структуры нагрузки. Сопровождение помогает собрать регулярность и убрать перекусы.'
//           : 'Начните с базы и прогрессии движения, затем закрепите результат в клубе. Так тело станет плотнее без жестких ограничений.',
//       href: q3 === 'support' ? '/programs/noedema' : '/programs/perezagruzka',
//       tag: 'система',
//     })
//   }

//   if (q2 === 'fit') {
//     return normalizeRec({
//       title: 'Клуб',
//       reason:
//         'Если вы уже тренируетесь, для роста результата нужна прогрессия и обновление плана. В клубе еженедельные тренировки и усложнение.',
//       href: '/club',
//       tag: 'прогрессия',
//     })
//   }

//   return normalizeRec({
//     title: 'Перезагрузка движений',
//     reason:
//       'Универсальная точка входа, когда нужно собрать тело в систему, наладить ритм и почувствовать стабильность.',
//     href: '/programs/perezagruzka',
//     tag: 'точка входа',
//   })
// }

// function QuizCard() {
//   const [q1, setQ1] = React.useState<QuizAnswer>('')
//   const [q2, setQ2] = React.useState<QuizAnswer>('')
//   const [q3, setQ3] = React.useState<QuizAnswer>('')

//   const ready = Boolean(q1 && q2 && q3)
//   const rec = React.useMemo(() => {
//     if (!ready) return null
//     return getRecommendation({ q1, q2, q3 })
//   }, [ready, q1, q2, q3])

//   return (
//     <Card className="rounded-3xl shadow-sm bg-background text-foreground">
//       <CardHeader>
//         <div className="flex items-start justify-between gap-4">
//           <div>
//             <CardTitle className="text-lg">Мини анкета</CardTitle>
//             <CardDescription>3 вопроса - рекомендация</CardDescription>
//           </div>
//           <Badge variant="secondary" className="bg-muted/40">
//             1-2 минуты
//           </Badge>
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-6">
//         <div>
//           <div className="text-sm font-medium">1) {quiz.q1.label}</div>
//           <div className="mt-3">
//             <RadioCards
//               name="q1"
//               value={q1}
//               onChange={v => setQ1(v)}
//               options={quiz.q1.options}
//             />
//           </div>
//         </div>

//         <div>
//           <div className="text-sm font-medium">2) {quiz.q2.label}</div>
//           <div className="mt-3">
//             <RadioCards
//               name="q2"
//               value={q2}
//               onChange={v => setQ2(v)}
//               options={quiz.q2.options}
//             />
//           </div>
//         </div>

//         <div>
//           <div className="text-sm font-medium">3) {quiz.q3.label}</div>
//           <div className="mt-3">
//             <RadioCards
//               name="q3"
//               value={q3}
//               onChange={v => setQ3(v)}
//               options={quiz.q3.options}
//             />
//           </div>
//         </div>

//         <Separator />

//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div className="text-sm text-muted-foreground">
//             {ready ? 'Рекомендация готова' : 'Заполните все вопросы'}
//           </div>
//           <div className="flex gap-3">
//             <Button
//               variant="outline"
//               className="h-11 rounded-2xl"
//               onClick={() => {
//                 setQ1('')
//                 setQ2('')
//                 setQ3('')
//               }}
//             >
//               Сбросить
//             </Button>
//             <Button
//               className="h-11 rounded-2xl"
//               disabled={!ready}
//               onClick={() =>
//                 document
//                   .getElementById('quiz-result')
//                   ?.scrollIntoView({ behavior: 'smooth' })
//               }
//             >
//               Показать
//             </Button>
//           </div>
//         </div>

//         <div id="quiz-result" className="rounded-3xl border bg-muted/35 p-5">
//           {!ready || !rec ? (
//             <div className="text-sm text-muted-foreground">
//               Заполните квиз, чтобы увидеть рекомендацию.
//             </div>
//           ) : (
//             <div>
//               <div className="flex items-start justify-between gap-4">
//                 <div>
//                   <div className="text-xs text-muted-foreground">
//                     Ваша рекомендация
//                   </div>
//                   <div className="mt-1 text-lg font-semibold">{rec.title}</div>
//                 </div>
//                 <Badge variant="secondary" className="bg-background">
//                   {rec.tag}
//                 </Badge>
//               </div>
//               <div className="mt-3 text-sm text-muted-foreground leading-relaxed">
//                 {rec.reason}
//               </div>
//               <div className="mt-5 flex flex-col gap-3 sm:flex-row">
//                 <Button asChild className="h-11 rounded-2xl">
//                   <a href={rec.href}>Открыть страницу</a>
//                 </Button>
//                 <Button variant="outline" className="h-11 rounded-2xl" asChild>
//                   <a href="#cta">Написать в Telegram</a>
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   )
// }
// export default async function Home() {
//   const heroImageUrl = getImageUrl('images', '932A0186.jpeg')
//   const trainerImageUrl = getImageUrl('images', '932A0014.jpg')
//   const systemApproach = [
//     {
//       step: '01',
//       title: 'Диагностика и цель',
//       description:
//         'Сначала определяем стартовую точку, затем выбираем реалистичный темп и измеримый результат.',
//       tag: 'База',
//     },
//     {
//       step: '02',
//       title: 'План и дисциплина',
//       description:
//         'Программа строится вокруг расписания, питания и восстановления, чтобы прогресс был устойчивым.',
//       tag: 'Система',
//     },
//     {
//       step: '03',
//       title: 'Контроль и адаптация',
//       description:
//         'Мы корректируем нагрузки по самочувствию и динамике, сохраняя результат без перегрузок.',
//       tag: 'Рост',
//     },
//   ]
//   const faqs = [
//     {
//       question: 'Сколько тренировок в неделю нужно?',
//       answer:
//         'Обычно 3–4 тренировки дают устойчивый прогресс. Программу можно адаптировать под ваш график.',
//     },
//     {
//       question: 'Подходит ли новичкам?',
//       answer:
//         'Да. Программы масштабируются по уровню, а техника подробно объясняется в каждом блоке.',
//     },
//     {
//       question: 'Нужен ли инвентарь?',
//       answer:
//         'Базовый набор — коврик и эспандер. Для продвинутых программ можно добавить гантели.',
//     },
//     {
//       question: 'Как быстро будет результат?',
//       answer:
//         'Первые изменения заметны через 3–4 недели при регулярных тренировках и правильном питании.',
//     },
//   ]

//   return (
//     <main className="relative flex min-h-screen flex-col gap-16 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%),radial-gradient(circle_at_20%_30%,rgba(14,116,144,0.12),transparent_45%)] pb-20 pt-10 text-foreground">
//       <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
//       <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

//       <section className="relative">
//         <div className="container grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] py-8 sm:py-12">
//           <div className="flex flex-col gap-6">
//             <Badge variant="secondary" className="w-fit bg-emerald-100 text-emerald-900">
//               Онлайн фитнес-клуб
//             </Badge>
//             <div className="space-y-4">
//               <h1 className="font-montserrat text-4xl font-semibold tracking-tight sm:text-6xl">
//                 YA·NA·SPORTE
//               </h1>
//               <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
//                 Тренировки, которые ты любишь. Результаты, которые ты видишь. Личный контроль
//                 прогресса, гибкий график и видимый результат уже в первый месяц.
//               </p>
//             </div>
//             <div className="flex flex-wrap gap-3">
//               <Button size="lg" asChild>
//                 <Link href="/auth/sign-up">Начать тренироваться</Link>
//               </Button>
//               <Button variant="outline" size="lg" asChild>
//                 <Link href="#courses">Смотреть курсы</Link>
//               </Button>
//             </div>
//             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//               <span>Подходит новичкам</span>
//               <span>•</span>
//               <span>Нагрузка под тебя</span>
//               <span>•</span>
//               <span>Поддержка тренера</span>
//             </div>
//           </div>
//           <div className="relative">
//             <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-emerald-200/60 via-transparent to-sky-200/60 blur-2xl" />
//             <Card className="relative overflow-hidden border-white/40 bg-card/80 shadow-xl backdrop-blur">
//               <CardContent className="p-0">
//                 <div className="relative aspect-4/5 w-full">
//                   <Image
//                     src={heroImageUrl}
//                     alt="Тренировка в онлайн фитнес-клубе"
//                     fill
//                     priority
//                     sizes="(max-width: 768px) 100vw, 480px"
//                     className="object-cover"
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </section>

//       <section id="courses" className="relative">
//         <div className="container flex flex-col gap-8">
//           <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
//             <div className="space-y-2">
//               <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Программы</p>
//               <h2 className="font-montserrat text-3xl font-semibold sm:text-4xl">Курсы</h2>
//               <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
//                 Силовые, гибкость, выносливость и баланс. Выбирай программу под свою цель и ритм
//                 жизни.
//               </p>
//             </div>
//             <Button variant="ghost" asChild>
//               <Link href="/auth/sign-up">Получить подборку</Link>
//             </Button>
//           </div>
//           <CoursesList />
//         </div>
//       </section>

//       <section className="relative">
//         <div className="container grid gap-8 rounded-4xl bg-secondary/40 px-6 py-12 sm:px-10">
//           <div className="space-y-3">
//             <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Метод</p>
//             <h2 className="font-montserrat text-3xl font-semibold sm:text-4xl">
//               В чем заключается системный подход
//             </h2>
//             <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
//               Мы не даем случайные тренировки. Сначала цель, затем план, контроль и корректировки —
//               так результат становится стабильным.
//             </p>
//           </div>
//           <div className="grid gap-6 md:grid-cols-3">
//             {systemApproach.map((item) => (
//               <Card
//                 key={item.step}
//                 className="border-white/60 bg-white/80 shadow-sm backdrop-blur motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6"
//               >
//                 <CardContent className="flex h-full flex-col gap-4 p-6">
//                   <div className="flex items-center justify-between">
//                     <span className="font-montserrat text-2xl font-semibold text-foreground/80">
//                       {item.step}
//                     </span>
//                     <Badge variant="outline" className="border-emerald-200 text-emerald-900">
//                       {item.tag}
//                     </Badge>
//                   </div>
//                   <div className="space-y-2">
//                     <h3 className="font-montserrat text-lg font-semibold">{item.title}</h3>
//                     <p className="text-sm text-muted-foreground">{item.description}</p>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>

//       <section className="relative">
//         <div className="container grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="relative">
//             <div className="absolute -inset-6 rounded-4xl bg-linear-to-br from-emerald-200/60 via-transparent to-sky-200/60 blur-2xl" />
//             <Card className="relative overflow-hidden border-white/40 bg-card/80 shadow-xl backdrop-blur">
//               <CardContent className="p-0">
//                 <div className="relative aspect-4/5 w-full">
//                   <Image
//                     src={trainerImageUrl}
//                     alt="Тренер онлайн фитнес-клуба"
//                     fill
//                     sizes="(max-width: 768px) 100vw, 520px"
//                     className="object-cover"
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//           <div className="space-y-6">
//             <div className="space-y-3">
//               <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
//                 О тренере
//               </p>
//               <h2 className="font-montserrat text-3xl font-semibold sm:text-4xl">
//                 Тренер, который ведет до результата
//               </h2>
//               <p className="text-sm text-muted-foreground sm:text-base">
//                 Яна работает с людьми разного уровня подготовки, объединяя силовые методики и мягкие
//                 практики восстановления. Каждое занятие выстроено так, чтобы ты прогрессировал
//                 безопасно и уверенно.
//               </p>
//             </div>
//             <div className="grid gap-3 text-sm text-muted-foreground">
//               <span>• 8+ лет тренерского опыта</span>
//               <span>• Авторские программы на силу и гибкость</span>
//               <span>• Персональный разбор техники</span>
//             </div>
//             <Button size="lg" asChild>
//               <Link href="/auth/sign-up">Записаться на тренировку</Link>
//             </Button>
//           </div>
//         </div>
//       </section>

//       <section className="relative">
//         <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
//           <div className="space-y-3">
//             <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
//               Ответы на вопросы
//             </p>
//             <h2 className="font-montserrat text-3xl font-semibold sm:text-4xl">
//               Часто спрашивают
//             </h2>
//             <p className="text-sm text-muted-foreground sm:text-base">
//               Собрали самые популярные вопросы, чтобы ты быстрее принял решение и начал
//               тренироваться.
//             </p>
//             <Button variant="outline" asChild>
//               <Link href="/auth/sign-up">Хочу консультацию</Link>
//             </Button>
//           </div>
//           <Card className="border-white/60 bg-white/80 shadow-sm backdrop-blur">
//             <CardContent className="p-6">
//               <Accordion type="single" collapsible className="w-full">
//                 {faqs.map((item) => (
//                   <AccordionItem key={item.question} value={item.question}>
//                     <AccordionTrigger>{item.question}</AccordionTrigger>
//                     <AccordionContent className="text-muted-foreground">
//                       {item.answer}
//                     </AccordionContent>
//                   </AccordionItem>
//                 ))}
//               </Accordion>
//             </CardContent>
//           </Card>
//         </div>
//       </section>
//     </main>
//   )
// }

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
  const aboutImgeUrl = getImageUrl('images', 'about.webp')
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
      footer: true,
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

          {/* <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="font-montserrat text-2xl font-semibold sm:text-3xl">
                <span className="text-primary font-bold">Индивидуальная</span>{' '}
                работа
              </h2>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ServiceCard
                title="Сопровождение нутрициолога"
                description={`Глубокая диагностика, индивидуальный план и системное восстановление тела.

Индивидуальное сопровождение для тех, кто хочет разобраться в причине симптомов и настроить питание, нутрицевтики и образ жизни под себя.`}
                priceTitle="Подробнее"
                href="https://t.me/YanasporteOnline"
                imageUrl={relaxImageUrl}
              />
            </div>
            <Card className="w-full lg:col-span-7">
              <CardHeader className="space-y-3">
                <Badge className="w-fit" variant="secondary">
                  дистанционно
                </Badge>

                <h3 className="text-2xl font-semibold">Консультация онлайн</h3>

                <p className="text-muted-foreground">
                  Дистанционный формат работы для разбора вашего запроса и
                  выстраивания понятного плана действий. Встреча проходит в
                  видео-формате, с фокусом на текущее состояние, питание и
                  ключевые привычки.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-xl border p-4">
                    <p className="font-medium">Одна консультация</p>
                    <p className="text-sm text-muted-foreground">
                      55 минут в видео-формате
                      <br />
                      Telegram, Zoom или IMO
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border p-4">
                    <p className="font-medium">Сопровождение</p>
                    <p className="text-sm text-muted-foreground">
                      3 онлайн-консультации
                      <br />+ доступ к одному из курсов на 2 месяца
                    </p>
                  </div>
                </div>

                <Button className="w-full rounded-2xl">
                  Оставить заявку
                </Button>
              </CardContent>
            </Card>
          </div>
        </div> */}
          <div className="bg-primary/10 rounded-3xl p-5">
            <div className="flex items-center flex-wrap gap-2">
              {' '}
              <Badge className="w-fit" variant="secondary">
                дистанционно
              </Badge>
              <Badge className="w-fit" variant="secondary">
                персональный разбор
              </Badge>
            </div>
            <p className="text-muted-foreground py-6">
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
                      <div className="flex justify-between mb-4">
                        <h3 className="text-2xl font-semibold">{item.title}</h3>
                        <div className="bg-primary p-3 rounded-2xl w-14 h-14">
                          <Icon className="h-8 w-8 text-white" />
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
                          <Button variant="outline" className="rounded-2xl">
                            <Link href="#">Подробнее</Link>
                          </Button>
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

        <Card className="rounded-3xl bg-background/80 shadow-sm px-0 py-2">
          <CardContent className="px-2 ">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10">
              {/* Текст */}
              <div className="md:col-span-8 py-2 pl-2">
                <p className="text-lg font-semibold">Яна Степанова</p>

                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Эксперт по работе с телом, питанием и восстановлением. Помогаю
                  выстроить систему, которая даёт результат без крайностей, с
                  учётом физиологии, образа жизни и реальных ограничений.
                  Работаю не с симптомами, а с причинами, чтобы изменения были
                  устойчивыми и долгосрочными.
                </p>

                <div className="mt-5">
                  <Button asChild size="lg" className="rounded-2xl">
                    <Link href="/about">Подробнее о Яне</Link>
                  </Button>
                </div>
              </div>

              {/* Картинка */}
              <div className="md:col-span-4 flex md:justify-end">
                <div className="relative w-full md:max-w-[352px] overflow-hidden rounded-2xl bg-muted/40 aspect-4/3 md:aspect-3/4 lg:aspect-4/3 xl:aspect-6/6">
                  <Image
                    src={aboutImgeUrl}
                    alt="Яна Степанова"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
