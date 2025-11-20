import { UpdateProfileForm } from '@/features/update-profile/update-profile-form'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { server } from '@/app/server'
import { redirect } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session) {
    return redirect('/auth/sign-in')
  }

  return (
    <main className="space-y-8 py-14 container max-w-[600px]">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/profile/${id}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Link>
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold">Редактирование профиля</h1>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <UpdateProfileForm userId={id} callbackUrl={`/profile/${id}`} />
      </div>
    </main>
  )
}
