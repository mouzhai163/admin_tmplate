import * as React from "react"
import {
  IconInnerShadowTop,
} from "@tabler/icons-react"

import {
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import db from "@/db"
import { adminInfo } from "@/db/schema/admin_info"

export async function TeamSwitcher() {

  const admin_info = await db.select().from(adminInfo).limit(1).then(res => res[0])

  return (
    <SidebarMenuButton
      asChild
      className="data-[slot=sidebar-menu-button]:!p-1.5"
    >
      <a href="#">
        <IconInnerShadowTop className="!size-5" />
        <span className="text-base font-semibold">{admin_info?.consoleName || "默认后台系统"}</span>
      </a>
    </SidebarMenuButton>
  )
}
