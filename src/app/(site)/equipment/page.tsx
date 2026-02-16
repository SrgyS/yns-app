import { AppImage } from '@/shared/ui/app-image'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { equipmentItems } from '@/shared/lib/equipment'

export default function EquipmentPage() {
  return (
    <section className="flex flex-col gap-8 pt-17 pb-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">
          Оборудование для тренировок
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base max-w-2xl">
          Здесь собран список оборудования, которое понадобится для тренировок
          на курсе. Не переживайте: у всего есть недорогие варианты, а часть
          можно на первое время заменить вещами из дома. Покупать инвентарь
          можно постепенно в течение 1–3 месяцев. Начать тренировки вы сможете
          сразу после регистрации, потому что более 60% занятий не требуют
          дополнительного оборудования. Со временем лучше приобрести
          качественное оборудование, это разумная инвестиция в здоровье и
          красивое тело.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {equipmentItems.map(item => (
          <Card key={item.id} className="overflow-hidden rounded-3xl">
            <CardHeader className="block space-y-0">
              {item.image && (
                <div className="float-right ml-4 mb-2 -mr-4 -mt-2 h-20 w-20 overflow-hidden rounded-2xl relative">
                  <AppImage
                    src={`images/${item.image}`}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              )}
              <h2 className="text-lg font-semibold mb-3">{item.title}</h2>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
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
      </section>
    </section>
  )
}
