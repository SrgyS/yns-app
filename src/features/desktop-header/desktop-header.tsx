import { ToggleTheme } from '../theme/toggle-theme'
import { Layout } from './_ui/layout'
import { Logo } from './_ui/logo'
import { MainNav } from '@/features/navigation/desktop/main-nav'
import { Profile } from './_ui/profile'

export function DesktopHeader({
  variant,
}: Readonly<{
  variant: 'auth' | 'private' | 'public'
}>) {
  const isProfile = variant !== 'auth'

  return (
    <Layout
      logo={<Logo />}
      nav={isProfile && <MainNav />}
      profile={isProfile && <Profile />}
      actions={<ToggleTheme />}
    />
  )
}
