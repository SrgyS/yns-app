import Image from 'next/image'
import { getImageUrl } from '@/shared/lib/images'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

export function HeroSection() {
  const heroImageUrl = getImageUrl('images', 'hero.jpeg')

  return (
    <section className="relative flex flex-col justify-between overflow-hidden rounded-b-2xl py-14">
      {/* Background noise and top spacing for mobile */}
      <div className="pointer-events-none h-60 w-full bg-[rgba(210,217,214)] sm:h-0 min-[375px]:h-50 min-[425px]:h-40" />

      {/* Main Image Container */}
      <div className="relative h-[387px] w-full overflow-hidden rounded-b-2xl md:h-[600px]">
        {/* Gradient Overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-[linear-gradient(180deg,rgba(210,217,214,0.95)_0%,rgba(210,217,214,0.6)_80%,rgba(232,224,212,0)_100%)] sm:h-0" />
        <Image
          src={heroImageUrl}
          alt="Фото блока"
          fill
          priority
          className="object-cover object-[50%_28px] sm:object-[0%_0px] lg:object-[0%_-30px] xl:object-[0%_-225px] 2xl:object-[50%_-245px]"
          sizes="100vw"
        />
      </div>

      {/* Text Content Overlay */}
      <div className="container absolute top-16 z-20 pb-10 pt-2 md:pt-4">
        <div className="gap-8 sm:grid sm:grid-cols-12 items-end">
          <div className="sm:col-span-6 md:col-span-7 lg:col-span-6">
            <div className="backdrop-blur-md rounded-3xl border border-white/20 bg-background/50 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.12)] md:mt-0 md:bg-background/25 lg:p-8">
              <Badge variant="outline" className="rounded-full bg-background">
                <span className="mr-2 size-2 shrink-0 rounded-full bg-primary" />
                <span className="text-wrap text-[10px] font-medium sm:text-xs md:text-sm">
                  Онлайн программы и сопровождение
                </span>
              </Badge>

              <h1 className="mt-5 text-xl font-semibold leading-tight sm:tracking-tight lg:text-2xl">
                Система питания и движения, которая возвращает телу легкость и
                форму
              </h1>

              <p className="mt-4 max-w-xl text-xs leading-tight text-foreground sm:leading-relaxed lg:text-sm">
                Без жестких диет и подвигов. С опорой на физиологию,
                регулярность и понятные шаги, которые можно встроить в
                реальную жизнь.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-8 rounded-2xl shadow-sm lg:h-12">
                  <a className="text-xs lg:text-base" href="#programs">
                    Выбрать программу
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
