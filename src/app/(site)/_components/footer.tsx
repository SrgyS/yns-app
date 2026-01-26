import { Logo } from '@/features/headers/top-bar/_ui/logo'
import { Separator } from '@/shared/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/shared/ui/button'

const footerSections = [
  {
    title: 'Курсы и предложения',
    links: [
      {
        title: 'Перезагрузка движения',
        href: '/#programs',
      },
      {
        title: 'Тело без отеков',
        href: '/#programs',
      },
      {
        title: 'Антикорка',
        href: '/#programs',
      },
      {
        title: 'Персональная работа',
        href: '/#individual',
      },
    ],
  },
  {
    title: 'Другие страницы',
    links: [
      {
        title: 'Главная',
        href: '/',
      },
      {
        title: 'Обо мне',
        href: '/about',
      },
      {
        title: 'Результаты и отзывы клиентов',
        href: '/results',
      },
      {
        title: 'Оборудование для тренировок',
        href: '/equipment',
      },
    ],
  },
]

export const Footer = () => {
  return (
    <footer className="border-t bg-black/85 text-slate-200 w-full">
      <div className="px-1.5 min-[375px]:container">
        <div className="py-8 sm:py-12 space-y-8">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 items-start gap-6 md:gap-8 mb-6">
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <Logo />
              <div className="flex items-center gap-1">
                <Link href="#" target="_blank">
                  <div className="bg-white rounded-full overflow-hidden p-1">
                    <Image
                      src="/youtube-icon.png"
                      alt="Youtube"
                      width={20}
                      height={20}
                      className="opacity-70 hover:opacity-100 transition"
                    />
                  </div>
                </Link>
                <Link href="#" target="_blank">
                  <div className="bg-white rounded-full overflow-hidden p-1">
                    <Image
                      src="/telegram-icon.png"
                      alt="Telegram"
                      width={20}
                      height={20}
                      className="opacity-70 hover:opacity-100 transition"
                    />
                  </div>
                </Link>
                <Link href="#" target="_blank">
                  <div className="bg-white rounded-full overflow-hidden p-1">
                    <Image
                      src="/vk-icon.png"
                      alt="VKontakte"
                      width={20}
                      height={20}
                      className="opacity-70 hover:opacity-100 transition"
                    />
                  </div>
                </Link>
                <Link href="#" target="_blank" className="relative">
                  <div className="bg-white rounded-full overflow-hidden p-1">
                    <Image
                      src="/instagram-icon.png"
                      alt="Instagram"
                      width={20}
                      height={20}
                      className="opacity-70 hover:opacity-100 transition"
                    />
                  </div>
                  <span className="absolute -right-1 -top-2 text-sm font-semibold text-slate-200">
                    *
                  </span>
                </Link>
              </div>
              <div className="text-[8px] sm:text-[10px] text-slate-300">
                Meta признана экстремистской организацией на территории РФ*
              </div>
            </div>
            {footerSections.map(({ title, links }) => (
              <div key={title} className="hidden md:block">
                <h6 className="font-bold text-[10px] sm:text-base">{title}</h6>
                <ul className="flex flex-col mt-2">
                  {links.map(({ title, href }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="text-[10px] sm:text-base text-slate-300 hover:text-slate-100"
                      >
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex gap-3 flex-col w-fit justify-self-start md:justify-self-start">
              <Button
                variant="outline"
                className="border-primary bg-transparent"
              >
                Личный кабинет
              </Button>
              <Button asChild>
                <Link href="https://t.me/YanasporteOnline">
                  Написать в техподдержку
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2  md:hidden">
            {footerSections.map(({ title, links }) => (
              <div key={title}>
                <h6 className="font-bold text-[10px] sm:text-base">{title}</h6>
                <ul className="flex flex-col mt-2">
                  {links.map(({ title, href }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="text-[10px] sm:text-base  text-slate-300 hover:text-slate-100"
                      >
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-slate-400/80" />
        <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-slate-300 text-[10px] sm:text-xs sm-gap-6">
          {/* Copyright */}

          <Link href="/oferta" target="_blank" className="hover:text-slate-100">
            Договор оферта
          </Link>
          <Link href="/policy" target="_blank" className="hover:text-slate-100">
            Политика обработки персональных данных
          </Link>
          <Link
            href="/data-consent"
            target="_blank"
            className="hover:text-slate-100"
          >
            Согласие на обработку персональных данных
          </Link>

          <div className="flex flex-col text-slate-300 gap-2 sm:col-start-3 sm:row-start-2 lg:col-start-4 lg:row-start-1">
            <p>ИП Степанова Яна Андреевна</p>
            <p>ИНН 616118846747</p>
          </div>
        </div>
        <p className="text-slate-300 py-2 text-xs text-center">
          &copy; {new Date().getFullYear()} yanasporte.online
        </p>
      </div>
    </footer>
  )
}
