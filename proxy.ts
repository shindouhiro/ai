import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 核心代理/中间件逻辑 (Linus 风格：务实、直观)
 */
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 1. 定义白名单 (显式、易读)
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicRoute = isAuthPage || isAuthApi;

  // 调试日志
  console.log(`[Proxy] ${pathname} | Auth: ${!!session}`);

  // 2. 鉴权逻辑：未登录处理
  if (!session && !isPublicRoute) {
    // API 请求返回 401 提示 X-Chat-Id
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: { 'Access-Control-Expose-Headers': 'X-Chat-Id' }
      });
    }
    // 页面请求重定向到 /login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. 已登录逻辑：访问登录页重定向到首页
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

/**
 * 标准 Matcher：排除静态文件与图标，其余全部走 Proxy 逻辑
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
