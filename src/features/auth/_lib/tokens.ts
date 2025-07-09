import { createId } from '@paralleldrive/cuid2'
import { getVerificationTokenByEmail } from './verification-token'
import { dbClient } from '@/shared/lib/db'
import { getPasswordResetTokenByEmail } from './password-reset-token'
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

export const generatePasswordResetToken = async (email: string) => {
  const token = createId()
  const expires = new Date(new Date().getTime() + 3600 * 1000)

  const exitingToken = await getPasswordResetTokenByEmail(email)
  if (exitingToken) {
    await dbClient.passwordResetToken.delete({
      where: {
        email_token: {
          email,
          token: exitingToken.token,
        },
      },
    })
  }

  const passwordResetToken = await dbClient.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  })

  return passwordResetToken
}
