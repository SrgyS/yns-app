import { SiteHeader } from '@/features/headers/site-header'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="container pb-17 md:pb-0 flex-1">{children}</div>
    </div>
  )
}
