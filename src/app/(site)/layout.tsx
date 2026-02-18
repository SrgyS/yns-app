import { SiteHeader } from '@/features/headers/site-header'
import { Footer } from './_components/footer'
import { MobileBottomNav } from '@/features/navigation/mobile/mobile-bottom-nav'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <SiteHeader />
      <main className="container pb-17 flex-1">{children}</main>
      <Footer className="pb-1" />
      <MobileBottomNav variant="public" />
    </div>
  )
}
