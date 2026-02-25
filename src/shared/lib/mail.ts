import { Resend } from 'resend'

const createResendClient = () => {
  const resendApiKey = process.env.RESEND_API_KEY

  if (resendApiKey === undefined) {
    throw new Error('RESEND_API_KEY is required to send emails')
  }

  return new Resend(resendApiKey)
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const resend = createResendClient()
  const confirmLink = `${process.env.NEXT_PUBLIC_PUBLIC_URL}/auth/verify-request?token=${token}`
  console.log('sendVerificationEmail', { email, token, confirmLink })
  const data = await resend.emails.send({
    from: 'Yanasporte <onboarding@resend.dev>',
    to: email,
    subject: 'Подтвердите свой адрес электронной почты',
    html: `<p>Для подтверждения нажмите <a href="${confirmLink}">ссылку</a></p>`,
  })

  console.log('answer', data)
}

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resend = createResendClient()
  const resetLink = `${process.env.NEXT_PUBLIC_PUBLIC_URL}/auth/new-password?token=${token}`

  const data = await resend.emails.send({
    from: 'Yanasporte <onboarding@resend.dev>',
    to: email,
    subject: 'Сброс пароля',
    html: `<p>Для сброса пароля нажмите <a href="${resetLink}">ссылку</a></p>`,
  })

  console.log('answer', data)
}
