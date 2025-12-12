import { DesktopHeader } from '@/features/desktop-header/desktop-header'
import { MobileBottomNav } from '@/features/navigation/mobile/mobile-bottom-nav'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DesktopHeader variant="public" />
      <div className="container pb-17 md:pb-0">{children}</div>
      <MobileBottomNav variant="public" />
    </>
  )
}
