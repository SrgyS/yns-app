import { server } from '@/app/server'
import { UpdateProfileForm } from '@/features/update-profile/update-profile-form'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { Separator } from '@/shared/ui/separator'
import { redirect } from 'next/navigation'

const sessionService = server.get(SessionService)
export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams

  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }
  return (
    <main className="space-y-6 py-14 container  max-w-[600px]">
      <div>
        <h3 className="text-lg font-medium">Последний шаг</h3>
        <p className="text-sm text-muted-foreground">
          Обновите профиль, это как другие пользователи увидят вас на сайте
        </p>
      </div>
      <Separator />
      <UpdateProfileForm userId={session.user.id} callbackUrl={callbackUrl} variant="onboarding" />
    </main>
  )
}
