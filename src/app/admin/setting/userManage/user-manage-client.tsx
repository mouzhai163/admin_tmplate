"use client"

import * as React from "react"
import { DataTable } from "@/components/m_ui/data-table"
import { columns } from "./columns"
import { User } from "@/db/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  UserDetailDialog,
  UserEditDialog,
  DeleteUserDialog,
} from "./user-dialogs"
import { Plus, RefreshCw, Trash2, ShieldOff, Shield, MoreHorizontal, Eye, Edit, ChevronDown, Mail } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserManageClientProps {
  initialUsers: User[]
}

export function UserManageClient({ initialUsers }: UserManageClientProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers)
  const [selectedRows, setSelectedRows] = React.useState<User[]>([])
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  // 对话框状态
  const [detailUser, setDetailUser] = React.useState<User | null>(null)
  const [editUser, setEditUser] = React.useState<User | null>(null)
  const [deleteUser, setDeleteUser] = React.useState<User | null>(null)
  const [showNewUserDialog, setShowNewUserDialog] = React.useState(false)
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = React.useState(false)
  const [showBatchBanDialog, setShowBatchBanDialog] = React.useState(false)

  //TODO:刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // 重新获取用户列表
      const response = await fetch('/api/user?all=true')
      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }
      const data = await response.json()
      setUsers(data.users || [])
      toast.success("数据刷新成功")
    } catch (error) {
      console.error("刷新失败:", error)
      toast.error("刷新失败，请重试")
    } finally {
      setIsRefreshing(false)
    }
  }


  //TODO:批量删除
  const handleBatchDelete = async () => {
    try {
      const userIds = selectedRows.map(user => user.id);
      const response = await fetch('/api/user/delete', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: userIds }),
      })
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || result.message || "删除失败");
      }
      // 从列表中移除删除的用户
      setUsers(prevUsers => prevUsers.filter(user => !userIds.includes(user.id)));
      toast.success(`成功删除 ${selectedRows.length} 个用户`)
      setShowBatchDeleteDialog(false)
      setSelectedRows([])
    } catch (error) {
      console.error("批量删除失败:", error)
      toast.error(error instanceof Error ? error.message : "删除失败，请重试")
    }
  }

  // TODO:批量解封
  const handleBatchUnban = async () => {
    try {
      // TODO: 调用 API 批量解封
      const bannedCount = selectedRows.filter(u => u.banned).length
      toast.success(`成功解封 ${bannedCount} 个用户`)
      setSelectedRows([])
    } catch (error) {
      console.error("批量解封失败:", error)
      toast.error("解封失败，请重试")
    }
  }

  //TODO:批量封禁
  const handleBatchBan = async () => {
    try {
      // TODO: 调用 API 批量封禁
      const unbannedCount = selectedRows.filter(u => !u.banned).length
      toast.success(`成功封禁 ${unbannedCount} 个用户`)
      setShowBatchBanDialog(false)
      setSelectedRows([])
    } catch (error) {
      console.error("批量封禁失败:", error)
      toast.error("封禁失败，请重试")
    }
  }

  // TODO:批量发送重置密码链接
  const handleBatchSendResetPassword = async () => {
    try {
      // TODO: 调用 API 批量发送重置密码邮件
      toast.success(`已向 ${selectedRows.length} 个用户发送重置密码邮件`)
      setSelectedRows([])
    } catch (error) {
      console.error("批量发送重置密码失败:", error)
      toast.error("发送失败，请重试")
    }
  }

  // 编辑用户
  const handleEditUser = async (data: Partial<User>) => {
    try {
      const response = await fetch(`/api/user/edit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || result.message || "更新失败");
      }
      const {updateData}: {updateData: User} = await response.json();
      // 更新本地用户列表
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updateData.id ? updateData : user
        )
      );
      
      toast.success("用户更新成功")
      // 成功后关闭对话框
      setEditUser(null)
    } catch (error) {
      console.error("编辑用户失败:", error)
      toast.error(error instanceof Error ? error.message : "更新失败，请重试")
    }
  }

  // 新增用户
  const handleCreateUser = async (data: Partial<User>) => {
    try {
      const response = await fetch('/api/user/create', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || result.message || "创建失败");
      }
      const newUser = await response.json();
      // 将新用户添加到列表
      setUsers(prevUsers => [newUser.data, ...prevUsers]);
      toast.success("用户创建成功")
      // 成功后关闭对话框
      setShowNewUserDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败，请重试")
    }
  }

  // 删除用户
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      const response = await fetch('/api/user/delete', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteUser.id }),
      })
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || result.message || "删除失败");
      }
      
      // 从列表中移除删除的用户
      setUsers(prevUsers => prevUsers.filter(user => user.id !== deleteUser.id));
      toast.success("用户已删除")
      setDeleteUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，请重试")
    }
  }

  // 修改 columns，注入事件处理器
  const enhancedColumns = React.useMemo(() => {
    return columns.map((col) => {
      if (col.id === "actions") {
        return {
          ...col,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cell: ({ row }: any) => {
            const user = row.original
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">打开菜单</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDetailUser(user)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    查看详情
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setEditUser(user)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => setDeleteUser(user)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          },
        }
      }
      return col
    })
  }, [])

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* 页面标题和操作栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">用户管理</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                刷新
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditUser(null)
                  setShowNewUserDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                新增用户
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 数据表格 */}
          <DataTable
            columns={enhancedColumns}
            data={users}
            searchPlaceholder="搜索用户名、邮箱..."
            onRowSelectionChange={setSelectedRows}
            selectedCount={selectedRows.length}
            batchActions={
                <div className="flex items-center gap-4">
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        批量操作
                        <ChevronDown className="ml-2 h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={handleBatchSendResetPassword}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        发送重置密码链接
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowBatchBanDialog(true)}
                        disabled={!selectedRows.some(u => !u.banned)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        批量封禁
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBatchUnban}
                        disabled={!selectedRows.some(u => u.banned)}
                      >
                        <ShieldOff className="mr-2 h-4 w-4" />
                        批量解封
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setShowBatchDeleteDialog(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        批量删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        将角色变更为
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem>管理员</DropdownMenuItem>
                      <DropdownMenuItem>普通用户</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>


                  {selectedRows.length > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    已选择 {selectedRows.length} 项
                  </span>
                  ) : null
                  }
                </div>
            }
          />
        </CardContent>
      </Card>

      {/* 对话框组件 */}
      {/* 用户详情对话框 */}
      {detailUser && (
        <UserDetailDialog
          key="detail-user-dialog"
          user={detailUser}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDetailUser(null)
            }
          }}
        />
      )}

      {/* 编辑用户对话框 */}
      {editUser && (
        <UserEditDialog
          key="edit-user-dialog"
          user={editUser}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditUser(null)
            }
          }}
          onSave={handleEditUser}
        />
      )}

      {/* 新增用户对话框 */}
      {showNewUserDialog && (
        <UserEditDialog
          key="new-user-dialog"
          user={null}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setShowNewUserDialog(false)
            }
          }}
          onSave={handleCreateUser}
        />
      )}

      {/* 删除用户对话框 */}
      {deleteUser && (
        <DeleteUserDialog
          key="delete-user-dialog"
          user={deleteUser}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteUser(null)
            }
          }}
          onConfirm={handleDeleteUser}
        />
      )}

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除选中的 {selectedRows.length} 个用户吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量封禁确认对话框 */}
      <AlertDialog open={showBatchBanDialog} onOpenChange={setShowBatchBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量封禁</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要封禁选中的 {selectedRows.filter(u => !u.banned).length} 个用户吗？
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                提示：已封禁的用户将被跳过
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchBan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认封禁
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
