import { ProfileAvatar } from '@/entities/user/_ui/profile-avatar'
import { Profile } from '@/entities/user/client'
import { SharedUser } from '@/kernel/domain/user'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'
import Link from 'next/link'

export function NavUser({ user }: { user: SharedUser }) {
  const profile: Profile = {
    email: user.email ?? '',
    name: user.name,
    image: user.image,
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Link href={`/cabinet/profile/${user.id}`}>
            <ProfileAvatar profile={profile} className="h-8 w-8" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
