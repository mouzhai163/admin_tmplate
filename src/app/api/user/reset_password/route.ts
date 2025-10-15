import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/checkSession";

export async function POST(request: NextRequest) {
      // 权限验证
      const session = await requireAdminSession()

      if(!session) {
          return NextResponse.json({ error: "用户未登录" }, { status: 401 })
      }
  
      if(session && session.user.role !== "admin") {
          return NextResponse.json({ error: "用户无权限" }, { status: 401 })
      }
}