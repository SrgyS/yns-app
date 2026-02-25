'use client'

import React from 'react'
import Link from 'next/link'
import { EquipmentBlock } from '@/kernel/domain/course-page'
import { equipmentItems } from '@/shared/lib/equipment'
import { AppImage } from '@/shared/ui/app-image'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'

export function EquipmentBlockComponent({
  title = 'Оборудование для курса',
  itemIds,
}: EquipmentBlock) {
  let itemsToRender = equipmentItems

  if (itemIds && itemIds.length > 0) {
    itemsToRender = equipmentItems.filter((item) => itemIds.includes(item.id))
  }

  if (itemsToRender.length === 0) {
    return null
  }

  return (
    <section className="space-y-4 py-5 md:space-y-6 md:py-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
        {itemsToRender.map(item => (
          <Card key={item.id} className="overflow-hidden rounded-3xl">
            <CardHeader className="block space-y-0 p-4 md:p-6">
              {item.image && (
                <div className="relative float-right -mt-2 mb-2 ml-4 h-20 w-20 overflow-hidden rounded-2xl">
                  <AppImage
                    src={`images/${item.image}`}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="mb-2 text-base font-semibold md:mb-3 md:text-lg">
                {item.title}
              </h3>
              <p className="text-[13px] leading-snug text-muted-foreground md:text-sm">
                {item.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 md:space-y-4 md:p-6 md:pt-0">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Чем заменить</p>
                <p className="text-[13px] leading-snug text-muted-foreground md:text-sm">
                  {item.replacement}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Где купить</p>
                {item.buy.href ? (
                  <Link
                    href={item.buy.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] text-primary hover:underline md:text-sm"
                  >
                    {item.buy.label}
                  </Link>
                ) : (
                  <p className="text-[13px] leading-snug text-muted-foreground md:text-sm">
                    {item.buy.label}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
