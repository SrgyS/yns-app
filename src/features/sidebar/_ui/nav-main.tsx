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
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    // isActive?: boolean
    // items?: {
    //   title: string
    //   url: string
    // }[]
  }[]
}) {
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
                className="flex items-center gap-2"
                onClick={handleNavigate}
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
