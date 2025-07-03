import { authCredentialsApi } from "../_api"

export function useCredentialsSignUp () {
  const registerMutation = authCredentialsApi.auth.register.useMutation({
    onSuccess(data) {
      console.log('onSuccess', data)
    },
    onError(error) {
      if (error instanceof Error) {
        console.error('onError', error.message)
      }
    }
  })

  return {
    isPending: registerMutation.isPending,
    credentialsSignUp: registerMutation.mutate,
  }
}


