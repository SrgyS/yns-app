import { Card, CardContent, CardHeader } from '@/shared/ui/card'

export default function TermsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold text-center">Пользовательское соглашение</h1>
          <p className="text-muted-foreground text-center">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящее Пользовательское соглашение регулирует отношения между пользователем и
                платформой YanaSporte в отношении использования сервиса и связанных с ним услуг.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Принятие условий</h2>
              <p className="text-muted-foreground leading-relaxed">
                Используя наш сервис, вы соглашаетесь с настоящими условиями. Если вы не согласны с
                какими-либо положениями, пожалуйста, не используйте наш сервис.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Описание сервиса</h2>
              <p className="text-muted-foreground leading-relaxed">
                YanaSporte предоставляет платформу для обучения спортивному питанию, включая курсы,
                рецепты, практические материалы и знания в области здорового образа жизни.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Регистрация и аккаунт</h2>
              <p className="text-muted-foreground leading-relaxed">
                Для доступа к полному функционалу сервиса требуется регистрация. Вы несете
                ответственность за сохранность своих учетных данных и за все действия, совершенные
                под вашим аккаунтом.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Правила использования</h2>
              <p className="text-muted-foreground leading-relaxed">
                Запрещается использовать сервис для незаконной деятельности, нарушения прав других
                пользователей или распространения вредоносного контента.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Конфиденциальность</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы обязуемся защищать вашу личную информацию в соответствии с нашей Политикой
                конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Изменения в соглашении</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы оставляем за собой право изменять настоящее соглашение. О существенных изменениях
                пользователи будут уведомлены через сервис или по электронной почте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed">
                По всем вопросам, связанным с настоящим соглашением, обращайтесь к нам через
                контактную форму на сайте или по электронной почте.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
