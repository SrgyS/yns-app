import { DesktopHeader } from '@/features/desktop-header/desktop-header'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DesktopHeader variant="public" />
      {children}
    </>
  )
}
