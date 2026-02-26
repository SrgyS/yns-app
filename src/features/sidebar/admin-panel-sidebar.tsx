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
import { useSupportChatUnansweredCount } from '@/features/support-chat/_vm/use-support-chat'

export function AdminPanelSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SharedUser }) {
  const unansweredCountQuery = useSupportChatUnansweredCount()
  const unansweredCount = unansweredCountQuery.data?.count ?? 0
  const items = adminNavItems.map(item => {
    if (item.badgeKey === 'support-chat-unanswered') {
      return {
        ...item,
        badgeCount: unansweredCount,
      }
    }

    return item
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
