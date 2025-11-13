'use client'
import { type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar'
import Link from 'next/link'
export function NavMain({
  items,
}: {
  items: {
    title: string
    href: string
    icon?: LucideIcon
    isActive?: boolean
    // items?: {
    //   title: string
    //   url: string
    // }[]
  }[]
}) {
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
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.href} className="flex items-center gap-2">
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
