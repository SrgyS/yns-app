'use client'

import React from 'react'
import Link from 'next/link'
import { FitCheckBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Check, Shield } from 'lucide-react'

export function FitCheckBlockComponent({
  title,
  goodFor,
  notGoodFor,
  contactOptions,
}: FitCheckBlock) {
  return (
    <section className="space-y-4 md:space-y-6">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* Кому подходит */}
        <Card className="rounded-3xl">
          <CardHeader className="p-4 md:p-6">
            <CardTitle>Кому подходит</CardTitle>
            <CardDescription>
              Быстро проверьте, ваш ли это формат
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
            <ul className="space-y-1.5 text-sm md:space-y-2">
              {goodFor.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Когда лучше иначе */}
        <Card className="rounded-3xl">
          <CardHeader className="p-4 md:p-6">
            <CardTitle>Когда лучше иначе</CardTitle>
            <CardDescription>
              Безопасность и здравый подход к телу
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 md:space-y-4 md:p-6 md:pt-0">
            <ul className="space-y-1.5 text-sm text-muted-foreground md:space-y-2">
              {notGoodFor.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {contactOptions && (
              <div className="rounded-2xl border bg-background p-3">
                <div className="text-xs font-medium">Если сомневаетесь</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Напишите в службу заботы и получите подбор.
                </div>
                <div className="mt-2 flex gap-2">
                  {contactOptions.telegram && (
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={contactOptions.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Telegram
                      </Link>
                    </Button>
                  )}
                  {contactOptions.whatsapp && (
                    <Button size="sm" variant="outline" asChild>
                      <Link
                        href={contactOptions.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
