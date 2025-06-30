import AuthorizedGuard from '@/features/auth/authorized-guard'
import { DesktopHeader } from '@/features/desktop-header/desktop-header'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DesktopHeader variant="private" />
      <AuthorizedGuard>{children}</AuthorizedGuard>
    </>
  )
}
