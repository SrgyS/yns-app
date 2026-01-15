import { SiteHeader } from '@/features/headers/site-header'
import { Footer } from './_components/footer'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="container pb-17 flex-1">{children}</div>
      <Footer />
    </div>
  )
}
