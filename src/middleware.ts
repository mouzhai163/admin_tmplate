// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export function middleware(request: NextRequest) {

  return NextResponse.next();
}

// 同时匹配 /admin 及其所有子路由：["/admin/:path*"]
export const config = {
  matcher: ["/admin/:path*"],
  // 允许中间件在nodejs环境下运行,开启后可以直接使用auth.api.getSession()
  // runtime: "nodejs",
};
