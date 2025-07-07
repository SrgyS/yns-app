import { BackButton } from '@/features/auth/_ui/back-button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { TriangleAlert } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="container relative flex-col items-center justify-center self-center pt-24">
      <Card className="max-w-[350px] mx-auto">
        <CardHeader className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight self-center text-center">
            Ошибка входа
          </h1>
          <TriangleAlert className="h-10 w-10 self-center text-destructive" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="px-0 text-center text-sm text-muted-foreground">
            Ошибка входа. Пожалуйста, попробуйте снова.
          </p>
        </CardContent>
        <BackButton href="/auth/sign-in" label="Вернуться на страницу входа" />
      </Card>
    </div>
  )
}
