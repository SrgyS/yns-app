'use client'

import React from 'react'
import { SignatureBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Check } from 'lucide-react'

export function SignatureBlockComponent({
  title,
  variant,
  content,
}: SignatureBlock) {
  return (
    <section className="space-y-4 md:space-y-6">
      {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
      
      {variant === 'reboot' && <RebootVariant content={content} />}
      {variant === 'edema' && <EdemaVariant content={content} />}
      {variant === 'antikorka' && <AntikorkaVariant content={content} />}
      {variant === 'club' && <ClubVariant content={content} />}
    </section>
  )
}

function RebootVariant({ content }: { content: SignatureBlock['content'] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      {content.entryLevels && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Уровни входа</CardTitle>
            <CardDescription>
              Чтобы новичок не попадал в перегруз
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.entryLevels.map(level => (
              <div key={`${level.title}-${level.description}`} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-medium text-foreground">
                    {level.title}
                  </span>
                  {' → '}
                  {level.description}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {content.first7Days && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Первые 7 дней</CardTitle>
            <CardDescription>
              Старт, который делает тело «готовым»
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.first7Days.map(item => (
              <div key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EdemaVariant({ content }: { content: SignatureBlock['content'] }) {
  return (
    <div className="space-y-3 md:space-y-4">
      {content.keys && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">3 ключа курса</CardTitle>
            <CardDescription>Без запретов, но с системой</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {content.keys.map(key => (
              <div key={`${key.title}-${key.description}`}>
                <div className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">
                      {key.title}
                    </span>
                    {' → '}
                    {key.description}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {content.selfTest && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Самотест на прогресс</CardTitle>
            <CardDescription>
              Простой трэк, который повышает вовлечённость
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.selfTest.map(item => (
              <div key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AntikorkaVariant({ content }: { content: SignatureBlock['content'] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      {content.progressCriteria && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Критерии прогресса</CardTitle>
            <CardDescription>Плотность - это не только вес</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.progressCriteria.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {content.workbookFeatures && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Тетрадь</CardTitle>
            <CardDescription>Самотесты и контроль динамики</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.workbookFeatures.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ClubVariant({ content }: { content: SignatureBlock['content'] }) {
  return (
    <div className="space-y-3 md:space-y-4">
      {content.weekPlan && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">План недели</CardTitle>
            <CardDescription>
              Пример структуры, чтобы вы видели логику
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2">
              {content.weekPlan.map((day, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[48px_1fr_72px] items-center gap-2 rounded-2xl border bg-muted/20 p-3"
                >
                  <div className="text-xs font-medium">{day.day}</div>
                  <div className="text-xs text-muted-foreground">
                    {day.focus}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {day.duration}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {content.monthlyUpdates && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">
              Что обновляется каждый месяц
            </CardTitle>
            <CardDescription>Чтобы тело не «привыкало»</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.monthlyUpdates.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {content.libraryFeatures && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Библиотека под задачи</CardTitle>
            <CardDescription>Когда нужно «точечно»</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {content.libraryFeatures.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
