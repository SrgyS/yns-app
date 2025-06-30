import { UpdateProfileForm } from '@/features/update-profile/update-profile-form'
import { Separator } from '@/shared/ui/separator'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="space-y-6 py-14 container  max-w-[600px]">
      <div>
        <h3 className="text-lg font-medium">Профиль</h3>
        <p className="text-sm text-muted-foreground">
          Это как другие пользователи видят вас на сайте
        </p>
      </div>
      <Separator />
      <UpdateProfileForm userId={id} />
    </main>
  )
}
