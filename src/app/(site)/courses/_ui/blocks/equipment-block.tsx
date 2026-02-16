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
    <section className="space-y-6 py-8">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {itemsToRender.map((item) => (
          <Card key={item.id} className="overflow-hidden rounded-3xl">
            <CardHeader className="block space-y-0">
              {item.image && (
                <div className="relative float-right -mr-4 -mt-2 mb-2 ml-4 h-20 w-20 overflow-hidden rounded-2xl">
                  <AppImage
                    src={`images/${item.image}`}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="mb-3 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Чем заменить</p>
                <p className="text-sm text-muted-foreground">
                  {item.replacement}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Где купить</p>
                {item.buy.href ? (
                  <Link
                    href={item.buy.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {item.buy.label}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
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
