import { createId } from '@paralleldrive/cuid2'
import { getVerificationTokenByEmail } from './verification-token'
import { dbClient } from '@/shared/lib/db'
export const generateVerificationToken = async (email: string) => {
  const token = createId()
  const expires = new Date(new Date().getTime() + 3600 * 1000) 

  const exitingToken = await getVerificationTokenByEmail(email)
  if (exitingToken) {
    await dbClient.verificationToken.delete({
      where: {
        email_token: {
          email,
          token: exitingToken.token,
        },
      },
    })
  }
  const verificationToken = await dbClient.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  })

  return verificationToken
}
