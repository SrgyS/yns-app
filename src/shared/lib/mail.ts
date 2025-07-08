import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${process.env.NEXT_PUBLIC_PUBLIC_URL}/auth/verify-request?token=${token}`
console.log('sendVerificationEmail', { email, token, confirmLink })
  const data =await resend.emails.send({
    from: 'Yanasporte <onboarding@resend.dev>',
    to: email,
    subject: 'Подтвердите свой адрес электронной почты',
    html:`<p>Для подтверждения нажмите <a href="${confirmLink}">ссылку</a></p>` })

  console.log('answer',data)
}
