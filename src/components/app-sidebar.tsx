import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavGoMain } from "@/components/nav-gomain"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"


export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarHeader>
          <TeamSwitcher />
        </SidebarHeader>
        <NavGoMain />
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
