import type { Metadata } from 'next'
import {
  Montserrat,
Inter,
  Nunito_Sans,
} from 'next/font/google'
import './globals.css'
import { cn } from '@/shared/ui/utils'
import { AppProvider } from './_providers/app-provider'

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat-alt',
  display: 'swap',
  weight: ['400', '600', '700'],
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: 'Yanasporte.online - жизнь в движении',
  description:
    'Международное приложение по восстановлению тела, осанки и метаболизма. Основано на физиологии, биомеханике и практике с доказанным эффектом. Без крайностей, с заботой о теле и здоровье. Защита персональных данных по GDPR и 152-ФЗ.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background antialiased font-sans',
          montserrat.variable,
          inter.variable,
          nunitoSans.variable
        )}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
