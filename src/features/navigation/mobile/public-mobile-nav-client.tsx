'use client'

import Link from 'next/link'
import { Dumbbell, Home, LogIn, Menu, User } from 'lucide-react'
import type { Course } from '@/entities/course'
import { SignInButton } from '@/features/auth/_ui/sign-in-button'
import { PUBLIC_NAV_ITEMS } from '@/features/navigation/nav-items'
import { Button } from '@/shared/ui/button'
import { SocialsRow } from '@/shared/ui/socials-row'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'

type PublicMobileNavClientProps = {
  courses: Course[]
  profileHref: string
  isAuthenticated: boolean
}

const bottomNavItemClass =
  'h-auto w-full flex-col items-center gap-1 p-2 text-xs text-muted-foreground transition-colors hover:text-primary'

export function PublicMobileNavClient({
  courses,
  profileHref,
  isAuthenticated,
}: Readonly<PublicMobileNavClientProps>) {
  const menuItems = PUBLIC_NAV_ITEMS.filter(item => {
    const isMobileItem = item.targets.includes('mobile')
    return isMobileItem && item.href !== '/'
  })

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <ul
        className="grid grid-cols-4 items-center justify-between px-2 py-2"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <li>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={bottomNavItemClass}
          >
            <Link href="/">
              <Home className="size-5" />
              <span>Главная</span>
            </Link>
          </Button>
        </li>

        <li>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={bottomNavItemClass}
              >
                <Dumbbell className="size-5" />
                <span>Курсы</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[80vh] overflow-y-auto pb-8"
            >
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Наши курсы</SheetTitle>
              </SheetHeader>
              <div className="grid gap-3">
                {courses.length > 0 ? (
                  courses.map(course => (
                    <SheetClose asChild key={course.id}>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="flex items-center justify-between  bg-card p-4 transition-colors hover:border-primary"
                      >
                        <span className="font-medium">{course.title}</span>
                      </Link>
                    </SheetClose>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    Курсы не найдены
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </li>

        <li>
          {isAuthenticated ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={bottomNavItemClass}
            >
              <Link href={profileHref}>
                <User className="size-5" />
                <span>Кабинет</span>
              </Link>
            </Button>
          ) : (
            <SignInButton
              variant="ghost"
              size="sm"
              className={bottomNavItemClass}
            >
              <LogIn className="size-5" />
              <span>Войти</span>
            </SignInButton>
          )}
        </li>

        <li>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={bottomNavItemClass}
              >
                <Menu className="size-5" />
                <span>Меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2">
                {menuItems.map(item => (
                  <SheetClose asChild key={item.key}>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-lg px-4 py-3 text-left text-sm font-medium"
                    >
                      <Link href={item.href}>{item.label}</Link>
                    </Button>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-6 border-t py-6 px-4  bg-black/75">
                <SocialsRow className="justify-center" />
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  )
}
