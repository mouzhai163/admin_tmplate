import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/checkSession";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
      // 权限验证
      const session = await requireAdminSession()
      if(!session) {
          return NextResponse.json({ error: "用户未登录" }, { status: 401 })
      }
      if(session.user.role !== "admin") {
          return NextResponse.json({ error: "用户无权限" }, { status: 401 })
      }
      const {id} = await request.json()
      if(!id) {
        return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
      }
      const res = await auth.api.removeUser({
        body: {
            userId: id
        },
        headers: await headers()
      })
      if(res.success) {
        return NextResponse.json({
          code: 200,
          message: "用户删除成功!",
        })
      } else {
        return NextResponse.json({
          code: 500,
          message: "用户删除失败!",
        }, { status: 500 })
      }
}