'use client'
import { type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavMain({
  items,
}: Readonly<{
  items: {
    title: string
    url: string
    icon?: LucideIcon
    badgeCount?: number
    badgeKey?: string
    // isActive?: boolean
    // items?: {
    //   title: string
    //   url: string
    // }[]
  }[]
}>) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map(item => (
          //   <Collapsible
          //     key={item.title}
          //     asChild
          //     defaultOpen={item.isActive}
          //     className="group/collapsible"
          //   >
          //     <SidebarMenuItem>
          //       <CollapsibleTrigger asChild>
          //         <SidebarMenuButton tooltip={item.title}>
          //           {item.icon && <item.icon />}
          //           <span>{item.title}</span>
          //           <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          //         </SidebarMenuButton>
          //       </CollapsibleTrigger>
          //       <CollapsibleContent>
          //         <SidebarMenuSub>
          //           {item.items?.map((subItem) => (
          //             <SidebarMenuSubItem key={subItem.title}>
          //               <SidebarMenuSubButton asChild>
          //                 <a href={subItem.url}>
          //                   <span>{subItem.title}</span>
          //                 </a>
          //               </SidebarMenuSubButton>
          //             </SidebarMenuSubItem>
          //           ))}
          //         </SidebarMenuSub>
          //       </CollapsibleContent>
          //     </SidebarMenuItem>
          //   </Collapsible>
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={pathname.startsWith(item.url)}
            >
              <Link
                href={item.url}
                className="flex w-full items-center gap-2"
                onClick={handleNavigate}
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                <span className="flex-1">{item.title}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {item.badgeCount}
                  </span>
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
