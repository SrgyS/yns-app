import { dbClient } from '@/shared/lib/db'

export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await dbClient.verificationToken.findFirst({
      where: { token },
    })
    return verificationToken
  } catch {
    return null
  }
}

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await dbClient.verificationToken.findFirst({
      where: { email },
    })
    return verificationToken
  } catch {
    return null
  }
}
