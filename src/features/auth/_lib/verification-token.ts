import { dbClient } from '@/shared/lib/db'

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
