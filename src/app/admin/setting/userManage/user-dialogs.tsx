"use client"

import * as React from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User } from "@/db/types"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, Mail, Shield, User as UserIcon } from "lucide-react"
import { DatePicker } from "@/components/m_ui/date-picker"
import { ImageUpload } from "@/components/m_ui/ImageUpload"
// 用户详情对话框
interface UserDetailDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDetailDialog({
  user,
  open,
  onOpenChange,
}: UserDetailDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
          <DialogDescription>查看用户的详细信息</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* 用户头像 */}
          {user.image && (
            <div className="flex justify-center pb-4 border-b">
              <div className="relative">
                <Image
                  src={user.image}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover border-4 border-muted"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">用户名</Label>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium break-all">{user.name}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">邮箱</Label>
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="break-all text-sm" title={user.email}>{user.email}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">角色</Label>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "管理员" : "普通用户"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">邮箱验证状态</Label>
              <Badge variant={user.emailVerified ? "default" : "destructive"}>
                {user.emailVerified ? "已验证" : "未验证"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">注册时间</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">
                  {format(user.createdAt, "yyyy-MM-dd HH:mm:ss", {
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">最后更新</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">
                  {format(user.updatedAt, "yyyy-MM-dd HH:mm:ss", {
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>
          </div>

          {user.banned && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive flex-shrink-0" />
                <Label className="text-destructive">封禁信息</Label>
              </div>
              <div className="grid gap-2">
                <div>
                  <Label className="text-muted-foreground text-sm">
                    封禁原因
                  </Label>
                  <p className="text-sm break-words">{user.banReason || "未说明原因"}</p>
                </div>
                {user.banExpires && (
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      封禁到期时间
                    </Label>
                    <p className="text-sm">
                      {format(user.banExpires, "yyyy-MM-dd HH:mm:ss", {
                        locale: zhCN,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 用户编辑对话框
interface UserEditDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: Partial<User>) => void
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: UserEditDialogProps) {
  const [formData, setFormData] = React.useState({
    id: "",
    name: "",
    email: "",
    role: "user",
    emailVerified: false,
    banned: false,
    banReason: "",
    banExpires: "",
    image: "",
    password: "",
  })

  React.useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        emailVerified: user.emailVerified,
        banned: user.banned || false,
        banReason: user.banReason || "",
        banExpires: user.banExpires ? format(user.banExpires, "yyyy-MM-dd'T'HH:mm") : "",
        image: user.image || "",
        password: "",
      })
    } else {
      setFormData({
        id: "",
        name: "",
        email: "",
        role: "user",
        emailVerified: false,
        banned: false,
        banReason: "",
        banExpires: "",
        image: "",
        password: "",
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSave: Partial<User> = {
      ...formData,
      banExpires: formData.banExpires ? new Date(formData.banExpires) : null,
    }
    onSave(dataToSave)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? "编辑用户" : "新增用户"}</DialogTitle>
          <DialogDescription>
            {user ? "修改用户信息" : "创建一个新用户"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                用户名
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                角色
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                用户头像
              </Label>
              <div className="col-span-3">
                <ImageUpload
                  value={formData.image}
                  onChange={(value) =>
                    setFormData({ ...formData, image: value })
                  }
                  maxSize={200} // 200KB
                  previewSize={100} // 预览尺寸100px
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emailVerified" className="text-right">
                邮箱验证
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.emailVerified ? "true" : "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, emailVerified: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">已验证</SelectItem>
                    <SelectItem value="false">未验证</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="banned" className="text-right">
                封禁状态
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.banned ? "true" : "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, banned: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">正常</SelectItem>
                    <SelectItem value="true">封禁</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.banned && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="banReason" className="text-right">
                    封禁原因
                  </Label>
                  <Textarea
                    id="banReason"
                    value={formData.banReason}
                    onChange={(e) =>
                      setFormData({ ...formData, banReason: e.target.value })
                    }
                    placeholder="请输入封禁原因"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="banExpires" className="text-right">
                    解封时间
                  </Label>
                  <DatePicker onChange={(dateTime) =>
                  {
                    console.log(dateTime)
                    setFormData({ ...formData, banExpires: dateTime ? dateTime.toString() : "" })
                  }}/>
                </div>
              </>
            )}
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="请输入密码"
                  className="col-span-3"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// 删除用户确认对话框
interface DeleteUserDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
}: DeleteUserDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除用户</DialogTitle>
          <DialogDescription>
            确定要删除用户 {user.name} ({user.email}) 吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
