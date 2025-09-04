'use client'
import { ProfileForm } from './_ui/profile-form'
import { useRouter } from 'next/navigation'
import { updateProfileApi } from './_api'
import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { ProfileFormSkeleton } from '@/shared/ui/skeleton/profile-form-skeleton'
import { UserId } from '@/kernel/domain/user'

export type UpdateProfileFormVariant = 'onboarding' | 'edit'

export function UpdateProfileForm({
  userId,
  callbackUrl,
  variant = 'edit',
}: {
  userId: UserId
  callbackUrl?: string
  variant?: UpdateProfileFormVariant
}) {
  const profileQuery = updateProfileApi.updateProfile.get.useQuery(
    { userId },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      placeholderData: prev => prev,
    }
  )

  const router = useRouter()
  const handleSuccess = () => {
    if (callbackUrl) {
      router.push(callbackUrl)
    }
  }

  if (profileQuery.isPending && !profileQuery.data) {
    return <ProfileFormSkeleton isLoading={profileQuery.isPending} />
  }

  if (!profileQuery.data) {
    return <div>Не удалось загрузить профиль, возможно у вас нет прав</div>
  }

  const isOnboarding = variant === 'onboarding'

  return (
    <ProfileForm
      userId={userId}
      profile={profileQuery.data}
      onSuccess={handleSuccess}
      submitText={isOnboarding ? 'Продолжить' : 'Сохранить'}
      allowSubmitPristine={isOnboarding}
    />
  )
}
