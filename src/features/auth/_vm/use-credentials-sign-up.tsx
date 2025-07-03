import { z } from 'zod'
import { authCredentialsApi } from '../_api'
import { emailSignUpSchema } from '../schemas'

// export function useCredentialsSignUp () {
//   const registerMutation = authCredentialsApi.auth.register.useMutation({
//     onSuccess(data) {
//       console.log('onSuccess', data)
//       return { success: 'Email sent successfully' }
//     },
//     onError(error) {
//       if (error instanceof Error) {
//         console.error('onError', error.message)
//         return { error: 'Ошибка при регистрации: ' + error.message }
//       }
//     }
//   })

//   return {
//     isPending: registerMutation.isPending,
//     credentialsSignUp: registerMutation.mutate,
//   }
// }

type CredentialsSignUpInput = z.infer<typeof emailSignUpSchema>
export function useCredentialsSignUp() {
  const registerMutation = authCredentialsApi.auth.register.useMutation()

  const credentialsSignUp = async (input: CredentialsSignUpInput) => {
    try {
      const data = await registerMutation.mutateAsync(input)
      return { success: 'Email sent successfully', data }
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
