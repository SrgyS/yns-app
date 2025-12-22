import { Card, CardContent, CardHeader } from '@/shared/ui/card'

export default function PrivacyPage() {
  return (
    <div className="mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <h1 className="text-3xl font-bold text-center">
            Политика конфиденциальности
          </h1>
          <p className="text-muted-foreground text-center">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
          </p>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности описывает, как YanaSporte
                собирает, использует и защищает вашу личную информацию при
                использовании нашего сервиса.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                2. Собираемая информация
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы собираем информацию, которую вы предоставляете при
                регистрации и использовании сервиса, включая имя, email, а также
                данные об использовании платформы.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                3. Использование информации
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Собранная информация используется для предоставления и улучшения
                наших услуг, персонализации контента и обеспечения безопасности
                аккаунта.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Защита данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы применяем соответствующие технические и организационные меры
                для защиты вашей личной информации от несанкционированного
                доступа, изменения или уничтожения.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                5. Передача данных третьим лицам
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы не продаем, не обмениваем и не передаем вашу личную
                информацию третьим лицам, за исключением случаев,
                предусмотренных законодательством или с вашего явного согласия.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Файлы cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы используем файлы cookie для улучшения работы сайта и анализа
                трафика. Вы можете отключить cookies в настройках вашего
                браузера.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Ваши права</h2>
              <p className="text-muted-foreground leading-relaxed">
                Вы имеете право на доступ, исправление, удаление и ограничение
                обработки ваших персональных данных. Для реализации этих прав
                обращайтесь к нам.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                8. Изменения в политике
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы можем обновлять данную политику конфиденциальности. О
                существенных изменениях пользователи будут уведомлены через
                сервис или по электронной почте.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">
                9. Контактная информация
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                По всем вопросам, связанным с обработкой персональных данных,
                обращайтесь к нам через контактную форму на сайте или по
                электронной почте.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
