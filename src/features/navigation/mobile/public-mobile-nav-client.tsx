'use client'

import Link from 'next/link'
import { Dumbbell, Home, LogIn, Menu, User } from 'lucide-react'
import { SignInButton } from '@/features/auth/_ui/sign-in-button'
import type { PublicNavigationLink } from '@/features/navigation/public-navigation-config'
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
  menuItems: PublicNavigationLink[]
  courseItems: PublicNavigationLink[]
  profileHref: string
  isAuthenticated: boolean
}

const bottomNavItemClass =
  'h-auto w-full flex-col items-center gap-1 p-2 text-xs text-muted-foreground transition-colors hover:text-primary'

function HomeNavItem() {
  return (
    <Button asChild variant="ghost" size="sm" className={bottomNavItemClass}>
      <Link href="/">
        <Home className="size-5" />
        <span>Главная</span>
      </Link>
    </Button>
  )
}

function CoursesSheet({ courseItems }: Readonly<{ courseItems: PublicNavigationLink[] }>) {
  return (
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
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto pb-8">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Наши курсы</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3">
          {courseItems.length > 0 ? (
            courseItems.map(course => (
              <SheetClose asChild key={course.key}>
                <Link
                  href={course.href}
                  className="flex items-center justify-between bg-card p-4 transition-colors hover:border-primary"
                >
                  <span className="font-medium">{course.label}</span>
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
  )
}

function ProfileNavItem({
  profileHref,
  isAuthenticated,
}: Readonly<{
  profileHref: string
  isAuthenticated: boolean
}>) {
  if (isAuthenticated) {
    return (
      <Button asChild variant="ghost" size="sm" className={bottomNavItemClass}>
        <Link href={profileHref}>
          <User className="size-5" />
          <span>Профиль</span>
        </Link>
      </Button>
    )
  }

  return (
    <SignInButton
      variant="ghost"
      size="sm"
      className={bottomNavItemClass}
    >
      <LogIn className="size-5" />
      <span>Войти</span>
    </SignInButton>
  )
}

function MenuSheet({ menuItems }: Readonly<{ menuItems: PublicNavigationLink[] }>) {
  return (
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
      <SheetContent side="bottom">
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
        <div className="mt-6 border-t bg-black/75 px-4 py-6">
          <SocialsRow className="justify-center" />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function PublicMobileNavClient({
  menuItems,
  courseItems,
  profileHref,
  isAuthenticated,
}: Readonly<PublicMobileNavClientProps>) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <ul
        className="grid grid-cols-4 items-center justify-between px-2 py-2"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <li>
          <HomeNavItem />
        </li>

        <li>
          <CoursesSheet courseItems={courseItems} />
        </li>

        <li>
          <ProfileNavItem
            profileHref={profileHref}
            isAuthenticated={isAuthenticated}
          />
        </li>

        <li>
          <MenuSheet menuItems={menuItems} />
        </li>
      </ul>
    </nav>
  )
}
