'use client'

import { AppImage } from '@/shared/ui/app-image'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import Link from 'next/link'

export default function AboutPage() {
  const aboutImgUrl = 'images/932A0111.jpg'
  const diplomImgNames = [
    'dip-1-min.webp',
    'dip-2-min.jpg',
    'dip-3-min.webp',
    'dip-4-min.webp',
    'dip-5-min.webp',
    'dip-6-min.webp',
    'dip-7-min.webp',
    'dip-8-min.webp',
    'dip-9-min.JPG',
    'dip-10-min.webp',
    'dip-11-min.webp',
    'dip-12-min.webp',
    'dip-14-min.jpg',
    'diplom-vospalenie.jpg',
    'genetic-min.webp',
    'yana-diplom1-min.jpg',
  ]

  return (
    <section className="pt-22 sm:pt-26 pb-14">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            О тренере
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Яна Степанова — персональный консультант по здоровью, питанию и
              фитнесу
            </h1>
            <p className="text-base text-muted-foreground">
              Помогаю выстроить понятную систему: движение, питание и поддержка,
              чтобы вы чувствовали себя сильнее и спокойнее.
            </p>
          </div>

          <Button asChild className="rounded-2xl">
            <Link href="https://t.me/dominadara">
              Записаться на консультацию
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden rounded-4xl border-0 bg-muted/30 shadow-sm p-0">
          <CardContent className="p-0">
            <div className="relative aspect-4/5 w-full">
              <AppImage
                src={aboutImgUrl}
                alt="Портрет тренера"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.25),transparent_55%),radial-gradient(circle_at_80%_10%,hsl(var(--foreground)/0.18),transparent_45%)]" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12">
        <Card className="rounded-4xl bg-background/80 shadow-sm">
          <CardContent className="space-y-4 p-6 sm:p-8">
            <p>
              Меня зовут Яна Степанова и я персональный консультант по вопросам
              здоровья, питания и фитнеса. Я стремлюсь помогать людям в
              достижении их целей в области здоровья и хорошего самочувствия с
              помощью индивидуальных планов и рекомендаций.
            </p>
            <p>
              Сколько себя помню, я была увлечена здоровьем и благополучием и
              посвятила свою жизнь тому, чтобы помогать другим людям полностью
              раскрыть свой потенциал в этой области. У меня есть глубокое
              понимание человеческого тела и того, как оно работает, и я
              использую эти знания для создания индивидуальных рекомендаций для
              каждого из моих клиентов.
            </p>
            <p>
              Мои услуги включают индивидуальные консультации, онлайн-коучинг и
              поддержку, чтобы вы могли оставаться на правильном пути и
              достигать своих целей, где бы вы ни находились. Вместе сделаем вас
              здоровее и счастливее!
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Моменты работы и тренировок
          </h2>
          <p className="text-sm text-muted-foreground">
            Несколько кадров из практики, чтобы познакомиться ближе.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {['Фото 1', 'Фото 2', 'Фото 3'].map(label => (
            <div
              key={label}
              className="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted/40"
            >
              <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--primary)/0.2),transparent_60%)]" />
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                {label} (заглушка)
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Дипломы и сертификаты
          </h2>
        </div>
        <div className="mt-6 columns-1 gap-4 sm:columns-3 lg:columns-4 [column-fill:balance]">
          {diplomImgNames.map(name => {
            const src = `images/${name}`

            return (
              <div key={name} className="mb-4 break-inside-avoid">
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-muted/10"
                    >
                      <AppImage
                        src={src}
                        alt={`Диплом ${name}`}
                        width={1200}
                        height={1600}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="h-auto w-full object-contain"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle className="sr-only">
                        Сертификат {name}
                      </DialogTitle>
                    </DialogHeader>
                      <div className="w-full">
                        <AppImage
                          src={src}
                          alt={`Диплом ${name}`}
                          width={1600}
                          height={2200}
                          sizes="(max-width: 1024px) 100vw, 900px"
                          className="h-auto w-full object-contain"
                        />
                      </div>
                  </DialogContent>
                </Dialog>
              </div>
            )
          })}
        </div>
      </section>
    </section>
  )
}
