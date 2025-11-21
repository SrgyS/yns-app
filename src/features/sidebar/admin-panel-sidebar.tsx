'use client'

import { NavMain } from './_ui/nav-main'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/shared/ui/sidebar'

import { adminNavItems } from './constants'
import { SharedUser } from '@/kernel/domain/user'
import { NavUser } from './_ui/nav-user'
import { NavLogo } from './_ui/nav-logo'

export function AdminPanelSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SharedUser }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
