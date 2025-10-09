import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { websiteInfo } from "@/db/schema/webSite_info";
import { requireAdminSession } from "@/lib/checkSession";


export async function GET(){
    // 权限验证
    const session = await requireAdminSession()

    if(!session) {
        return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    if(session && session.user.role !== "admin") {
        return NextResponse.json({ error: "用户无权限" }, { status: 401 })
    }

    const res = await db.select().from(websiteInfo).limit(1).then(res => res[0])
    return NextResponse.json(res)
}

export async function POST(request:NextRequest){
    // 权限验证
    const session = await requireAdminSession()
    if(!session) {
        return NextResponse.json({ error: "用户未登录" }, { status: 401 })
    }

    if(session && session.user.role !== "admin") {
        return NextResponse.json({ error: "用户无权限" }, { status: 401 })
    }

    
    const data = await request.json()
    const { siteName, siteDesc, siteKeywords, siteLogo } = data

    if (!siteName || !siteDesc) {
      return NextResponse.json({ error: "名称和描述不能为空" }, { status: 400 })
    }

    //更新设置
    await db.update(websiteInfo).set({
        siteName,
        siteDesc,
        siteKeywords,
        siteLogo,
    }).limit(1)
    
    return NextResponse.json({message: "网站设置已更新"})
}