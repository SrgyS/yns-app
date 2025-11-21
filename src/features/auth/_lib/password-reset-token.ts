import { dbClient } from '@/shared/lib/db'

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await dbClient.passwordResetToken.findUnique({
      where: { token },
    })

    return passwordResetToken
  } catch {
    return null
  }
}

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await dbClient.passwordResetToken.findFirst({
      where: { email },
    })

    return passwordResetToken
  } catch {
    return null
  }
}
