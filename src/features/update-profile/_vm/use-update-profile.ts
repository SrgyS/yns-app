import { useMutation } from '@tanstack/react-query'
import { updateProfileAction } from '../_actions/update-profile'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useInvalidateProfile } from '@/features/user/profile'
import { UserId } from '@/kernel/domain/user'

export const useUpdateProfile = () => {
  const { update: updateSession } = useAppSession()
  const invalidateProfile = useInvalidateProfile()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateProfileAction,
    async onSuccess({ profile }, { userId }) {
      await invalidateProfile(userId as UserId)
      await updateSession({
        user: profile,
      })
    },
  })

  return {
    update: mutateAsync,
    isPending,
  }
}
