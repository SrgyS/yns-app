import Link from 'next/link'
import { Logo } from '@/features/desktop-header/_ui/logo'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/shared/ui/sidebar'

export const NavLogo = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Logo withText={false} />
          </div>

          <div className="grid flex-1 text-left text-sm leading-tight">
            <Link href="/">
              <span className="truncate font-bold font-inter">
                ya&middot;na&middot;sporte
              </span>
            </Link>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
