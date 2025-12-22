'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, User } from 'lucide-react'
import { PUBLIC_NAV_ITEMS } from '@/features/navigation/nav-items'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/ui/utils'

export function PublicMobileNavClient() {
  const [open, setOpen] = useState(false)
  const mobileItems = PUBLIC_NAV_ITEMS.filter(item =>
    item.targets.includes('mobile')
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
            >
              <Menu className="size-5" />
              Меню
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-8">
            <SheetHeader>
              <SheetTitle>Навигация</SheetTitle>
            </SheetHeader>
            <div className="mt-4 grid gap-2">
              {mobileItems.map(item => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'w-full rounded-lg border px-4 py-3 text-left text-sm font-medium hover:border-primary hover:text-primary transition'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/cabinet/dashboard"
          className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition"
        >
          <User className="size-5" />
          Личный кабинет
        </Link>
      </div>
    </div>
  )
}
