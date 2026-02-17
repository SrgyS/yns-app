import { ToggleTheme } from '../../theme/toggle-theme'
import { Layout } from './_ui/layout'
import { Logo } from './_ui/logo'
import { MainNav } from '@/features/navigation/desktop/main-nav'
import { Profile } from './_ui/profile'

export function TopBar({
  variant,
}: Readonly<{
  variant: 'auth' | 'private' | 'public'
}>) {
  const isProfile = variant !== 'auth'

  return (
    <Layout
      logo={<Logo />}
      nav={
        isProfile && (
          <MainNav variant={variant === 'public' ? 'public' : 'private'} />
        )
      }
      profile={
        isProfile && (
          <div className="hidden md:block">
            <Profile />
          </div>
        )
      }
      actions={<ToggleTheme />}
    />
  )
}
