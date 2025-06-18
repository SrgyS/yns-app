// import { ToggleTheme } from "@/features/theme/toggle-theme";
import { ToggleTheme } from '../theme/toggle-theme'
import { Layout } from './_ui/layout'
import { Logo } from './_ui/logo'
import { MainNav } from './_ui/main-nav'
import { Profile } from './_ui/profile'

export function DesktopHeader({ variant }: { variant: 'auth' | 'private' | 'public' }) {
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
