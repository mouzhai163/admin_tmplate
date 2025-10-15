"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowUpDown,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { User } from "@/db/types"

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          用户名
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="flex items-center font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          邮箱
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return <div className="flex items-center lowercase">{row.getValue("email")}</div>
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          角色
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const role = row.getValue("role") as string | null
      return (
        <Badge 
          variant={role === "admin" ? "default" : "secondary"}
          className="min-w-[72px] justify-center"
        >
          {role === "admin" ? "管理员" : "普通用户"}
        </Badge>
      )
    },
    sortingFn: (rowA, rowB) => {
      const roleA = rowA.getValue("role") as string | null
      const roleB = rowB.getValue("role") as string | null
      // 当desc排序时，admin应该排在前面
      // 排序逻辑：admin为1，其他为0
      const scoreA = roleA === "admin" ? 1 : 0
      const scoreB = roleB === "admin" ? 1 : 0
      return scoreA - scoreB
    },
  },
  {
    accessorKey: "emailVerified",
    header: () => {
      return (
        <Button variant="ghost" className="hover:bg-transparent cursor-default">
          邮箱验证
        </Button>
      )
    },
    cell: ({ row }) => {
      const verified = row.getValue("emailVerified") as boolean
      return verified ? (
        <div className="flex items-center gap-1.5 text-green-600">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">已验证</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">未验证</span>
        </div>
      )
    },
  },
  {
    accessorKey: "banned",
    header: () => {
      return (
        <Button variant="ghost" className="hover:bg-transparent cursor-default">
          状态
        </Button>
      )
    },
    cell: ({ row }) => {
      const banned = row.getValue("banned") as boolean
      const banExpires = row.original.banExpires

      if (banned) {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="min-w-[60px] justify-center">已封禁</Badge>
            {banExpires && (
              <span className="text-xs text-muted-foreground">
                至 {format(banExpires, "yyyy-MM-dd", { locale: zhCN })}
              </span>
            )}
          </div>
        )
      }
      return <Badge variant="outline" className="min-w-[60px] justify-center">正常</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          注册时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date
      return (
        <div className="flex items-center whitespace-nowrap">
          {format(createdAt, "yyyy-MM-dd HH:mm", {
            locale: zhCN,
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          更新时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const updatedAt = row.getValue("updatedAt") as Date
      return (
        <div className="flex items-center whitespace-nowrap">
          {format(updatedAt, "yyyy-MM-dd HH:mm", {
            locale: zhCN,
          })}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: () => {
      return (
        <Button variant="ghost" className="hover:bg-transparent cursor-default">
          操作
        </Button>
      )
    },
    cell: () => null, // 操作单元格将在 user-manage-client.tsx 中被覆盖
  },
]