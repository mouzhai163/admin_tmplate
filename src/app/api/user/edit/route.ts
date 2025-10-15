import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/checkSession";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        // 权限验证
        const session = await requireAdminSession()

        if(!session) {
            return NextResponse.json({ error: "用户未登录" }, { status: 401 })
        }
    
        if(session.user.role !== "admin") {
            return NextResponse.json({ error: "用户无权限" }, { status: 401 })
        }

        const data = await request.json()
        
        // 检查是否有用户ID
        if(!data.id) {
            return NextResponse.json({ error: "缺少用户ID" }, { status: 400 })
        }

        // 移除不应该直接更新的字段
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt,banExpires, ...updateData } = data

        // 更新用户数据
        const res = await auth.api.adminUpdateUser({
            body: {
                userId: id,
                data: {
                    // 数据库中是Date属性,传递来的是String
                    banExpires: banExpires ? new Date(banExpires) : null,
                    ...updateData
                },
            },
            headers: await headers()
        })
        return NextResponse.json({ 
            code: 200,
            message: "用户数据更新成功!",
            updateData: res
        })
    } catch (error) {
        return NextResponse.json({ 
            code: 500,
            message: "用户数据更新失败!",
            error: error instanceof Error ? error.message : "未知错误"
        }, { status: 500 })
    }
}