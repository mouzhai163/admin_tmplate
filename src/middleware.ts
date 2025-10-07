// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export function middleware(request: NextRequest) {

  // const pathname = request.nextUrl.pathname;

  // // 1. 保护 /verify-success 页面
  // if (pathname === "/verify-success") {
  //   const verified = request.nextUrl.searchParams.get("verified");
  //   const error = request.nextUrl.searchParams.get("error");
    
  //   // 如果既没有 verified 也没有 error 参数,重定向到登录页
  //   if (!verified && !error) {
  //     return NextResponse.redirect(new URL("/", request.url));
  //   }
  // }
  return NextResponse.next();
}

// 同时匹配 /admin 及其所有子路由：["/admin/:path*"]
export const config = {
  matcher: ["/verify-success"],
  // 允许中间件在nodejs环境下运行,开启后可以直接使用auth.api.getSession()
  // runtime: "nodejs",
};
