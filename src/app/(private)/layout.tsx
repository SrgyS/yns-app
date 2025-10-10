import AuthorizedGuard from '@/features/auth/authorized-guard'
import { DesktopHeader } from '@/features/desktop-header/desktop-header'
import { MobileBottomNav } from '@/features/navigation/mobile/mobile-bottom-nav'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DesktopHeader variant="private" />
      <AuthorizedGuard>
        <div className="pb-17 md:pb-0">{children}</div>
      </AuthorizedGuard>
      <MobileBottomNav variant="private" />
    </>
  )
}
