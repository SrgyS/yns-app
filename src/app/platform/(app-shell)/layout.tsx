import { MobileBottomNav } from '@/features/navigation/mobile/mobile-bottom-nav'

export default function PlatformAppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      <MobileBottomNav variant="private" />
    </>
  )
}
