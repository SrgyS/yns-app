import { Logo } from '@/features/headers/top-bar/_ui/logo'
import { Separator } from '@/shared/ui/separator'
import { Youtube, Instagram, TwitchIcon, TwitterIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/shared/ui/button'

const footerSections = [
  {
    title: 'Курсы и предложения',
    links: [
      {
        title: 'Перезагрузка движения',
        href: '#',
      },
      {
        title: 'Тело без отеков',
        href: '#',
      },
      {
        title: 'Антикорка',
        href: '#',
      },
      {
        title: 'Персональная работа',
        href: '#',
      },
    ],
  },
  {
    title: 'Другие страницы',
    links: [
      {
        title: 'Главная',
        href: '#',
      },
      {
        title: 'Обо мне',
        href: '#',
      },
      {
        title: 'Результаты и отзывы клиентов',
        href: '#',
      },
      {
        title: 'Оборудование для тренировок',
        href: '#',
      },
    ],
  },
]

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="">
        <div className="py-12 px-0 md:px-6 xl:px-0 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 items-start gap-6 md:gap-8">
            <div className="flex flex-col gap-4">
              {/* Logo */}
              <Logo />
              <div className="flex items-center gap-1 text-muted-foreground">
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
                  <span className="absolute right-0 -top-2 text-sm font-semibold text-foreground">
                    *
                  </span>
                </Link>
              </div>
              <div className="text-xs text-muted-foreground">
                Meta признана экстремистской организацией на территории РФ*
              </div>
            </div>
            {footerSections.map(({ title, links }) => (
              <div key={title} className="hidden md:block">
                <h6 className="font-medium text-[10px] sm:text-xs">{title}</h6>
                <ul className="mt-6 space-y-4">
                  {links.map(({ title, href }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                      >
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex gap-3 flex-col w-fit justify-self-end md:justify-self-start">
              <Button variant="outline" className="border-primary">
                Личный кабинет
              </Button>
              <Button>Написать</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 md:hidden">
            {footerSections.map(({ title, links }) => (
              <div key={title}>
                <h6 className="font-medium text-xs">{title}</h6>
                <ul className="sm:mt-6 sm:space-y-4">
                  {links.map(({ title, href }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="text-xs text-muted-foreground hover:text-foreground"
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
        <Separator />
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          {/* Copyright */}
        

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="#" target="_blank">
              Политика обработки персональных данных
            </Link>
            <Link href="#" target="_blank">
              Договор оферта
            </Link>
            <Link href="#" target="_blank">
              Согласие на обработку персональных данных
            </Link>
          </div>
          <div className="flex flex-col text-xs text-muted-foreground gap-2">
            <p>ИП Степанова Яна Андреевна</p>
            <p>ИНН 123456789</p>
          </div>
        </div>
      </div>
        <span className="text-muted-foreground">
            &copy; {new Date().getFullYear()} yanasporte.online
          </span>
    </footer>
  )
}

export default Footer
