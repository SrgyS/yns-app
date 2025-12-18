import { TopBar } from '@/features/headers/top-bar/top-bar'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopBar variant="auth" />
      {children}
    </>
  )
}
