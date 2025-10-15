import { UserManageClient } from "./user-manage-client"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { User } from "@/db/types"

export default async function UserManagePage() {
  // 获取用户数据
  const users = await auth.api.listUsers({
    query: {
      limit: 100
    },
    headers: await headers(),
  })

  return <UserManageClient initialUsers={users.users as User[]} />
}