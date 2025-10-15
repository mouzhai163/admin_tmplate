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
      const {email,password,name} = await request.json()
      if(!email || !password || !name || password.length < 8) {
        return NextResponse.json({ error: "邮箱、密码和用户名为必填项,密码至少8位!" }, { status: 400 })
      }
      try{
        const res = await auth.api.createUser({
            body: {
                email,
                password,
                name,
            },
            headers: await headers()
          })

          return NextResponse.json({
            code: 200,
            message: "用户创建成功!",
            data: res.user
          })
      } catch (error) {
        return NextResponse.json({ 
            code: 500,
            message: "创建用户失败",
            error: error instanceof Error ? error.message : "未知错误"
        }, { status: 500 })
      }
      
}