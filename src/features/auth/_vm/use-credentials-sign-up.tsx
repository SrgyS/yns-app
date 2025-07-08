import { z } from 'zod'
import { authCredentialsApi } from '../_api'
import { emailSignUpSchema } from '../schemas'
import { AUTH_MESSAGES } from '@/shared/constants'

type CredentialsSignUpInput = z.infer<typeof emailSignUpSchema>
export function useCredentialsSignUp() {
  const registerMutation = authCredentialsApi.auth.register.useMutation()

  const credentialsSignUp = async (input: CredentialsSignUpInput) => {
    try {
      const data = await registerMutation.mutateAsync(input)
      return { success: AUTH_MESSAGES.EmailUnverified, data }
    } catch (error) {
      if (error instanceof Error) {
        return { error: 'Ошибка при регистрации: ' + error.message }
      }
      return { error: 'Неизвестная ошибка при регистрации' }
    }
  }

  return {
    isPending: registerMutation.isPending,
    credentialsSignUp,
  }
}
