import { redirect } from 'next/navigation'

import { UpdateProfileForm } from '@/features/update-profile/update-profile-form'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { server } from '@/app/server'
import { BackButton } from '@/shared/ui/back-button'

export default async function EditProfilePage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{ returnTo?: string }>
}>) {
  // TODO: Add admin flow for editing other users' profiles.
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const returnTo = resolvedSearchParams?.returnTo || '/platform/profile'

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  const id = session.user.id

  return (
    <section className="container space-y-8 md:py-14 max-w-150">
      <div className="flex items-center justify-start gap-2 md:gap-4">
        <BackButton href={returnTo} />
        <h1 className="text-fluid-lg font-semibold">Редактирование профиля</h1>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <UpdateProfileForm userId={id} callbackUrl={returnTo} />
      </div>
    </section>
  )
}
