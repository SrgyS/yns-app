import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { LeadRequestDialog } from '@/features/lead-request/_ui/lead-request-dialog'

const SUPPORT_EMAIL = 'yanasporte.online@gmail.com'
const PROGRAM_SELECTION_URL = '/individual-support'

export function CourseCtaBlock() {
  return (
    <section className="pt-5 md:pt-8">
      <Card className="overflow-hidden rounded-3xl bg-foreground text-background shadow-sm">
        <CardContent className="p-5 md:p-8">
          <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Если остались вопросы
              </h2>
              <p className="mt-3 max-w-xl text-sm opacity-80">
                Напишите нам, подскажем по формату, доступу и программе.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LeadRequestDialog source="site:course-page-cta:telegram">
                  <Button className="h-12 rounded-2xl bg-background text-foreground hover:bg-background/90">
                    Telegram
                  </Button>
                </LeadRequestDialog>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-2xl border-white/20 bg-transparent text-background hover:bg-white/10 hover:text-secondary"
                >
                  <Link href={`mailto:${SUPPORT_EMAIL}`}>Email</Link>
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold tracking-tight">
                  Готовы начать?
                </h3>
                <p className="max-w-xl text-sm opacity-80">
                  Выберите тариф или напишите если нужна помощь с выбором программы.
                </p>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-background text-foreground hover:bg-background/90"
                >
                  <Link href="#tariffs">Выбрать тариф</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-2xl border-white/20 bg-transparent text-background hover:bg-white/10 hover:text-secondary"
                >
                  <Link href={PROGRAM_SELECTION_URL}>Подобрать программу</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
