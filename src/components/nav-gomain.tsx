"use client"

import {
  House,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import Link from "next/link"

/**
 * 跳转后台首页 写死的
 * @returns 
 */
export function NavGoMain() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="tracking-wider">MAIN</SidebarGroupLabel>
      <SidebarMenuButton asChild>
        <Link href="/admin">
          <House />
          <span>控制台</span>
        </Link>
      </SidebarMenuButton>
    </SidebarGroup>
  )
}
