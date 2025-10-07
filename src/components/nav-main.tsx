"use client"

import { useEffect, useState } from "react"
import {
  BookOpen,
  Bot,
  ChevronRight,
  LucideIcon,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: {
    title: string
    url: string
  }[]
}

const items: NavItem[] = [
  {
    title: "Playground",
    url: "#",
    icon: SquareTerminal,
    items: [
      { title: "History", url: "#" },
      { title: "Starred", url: "#" },
      { title: "Settings", url: "#" },
    ],
  },
  {
    title: "Models",
    url: "#",
    icon: Bot,
    items: [
      { title: "Genesis", url: "#" },
      { title: "Explorer", url: "#" },
      { title: "Quantum", url: "#" },
    ],
  },
  {
    title: "Documentation",
    url: "#",
    icon: BookOpen,
    items: [
      { title: "Introduction", url: "#" },
      { title: "Get Started", url: "#" },
      { title: "Tutorials", url: "#" },
      { title: "Changelog", url: "#" },
    ],
  },
  {
    title: "Setting",
    url: "#",
    icon: Settings2,
    items: [
      { title: "网站设置", url: "/admin/setting/siteSetting" },
      { title: "用户管理", url: "/admin/setting/userManage" },
    ],
  },
]

// localStorage key
const STORAGE_KEY = "sidebar-open-groups"

// 默认展开组（你可以改成 "Playground" 或其他）
const DEFAULT_OPEN_GROUPS = ["Playground"]

export function NavMain() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  // 初始化：从 localStorage 读取
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setOpenGroups(new Set(JSON.parse(saved)))
    } else {
      setOpenGroups(new Set(DEFAULT_OPEN_GROUPS))
    }
  }, [])

  // 每次变化写入 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(openGroups)))
  }, [openGroups])

  const toggleGroup = (title: string, isOpen: boolean) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev)
      if (isOpen) {
        newSet.add(title)
      } else {
        newSet.delete(title)
      }
      return newSet
    })
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="tracking-wider">Main</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isOpen = openGroups.has(item.title)
          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(state) => toggleGroup(item.title, state)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          {/* <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a> */}
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
