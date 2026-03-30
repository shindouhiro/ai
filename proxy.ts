import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 直接使用统一的 auth 实例作为 proxy
// 这确保了 Middleware (Proxy) 和 Server Components 使用完全相同的解析逻辑和密钥
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/api/auth");

  // 调试日志：输出真正的 Session 状态 (API 和 页面)
  console.log(`[proxy] Target: ${pathname}, Session Found: ${!!session}`);

  if (!session && !isPublicRoute) {
    // 关键修正：API 请求未授权应返回 401，而不是 302 重定向
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: { 'Access-Control-Expose-Headers': 'X-Chat-Id' }
      });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isPublicRoute && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)", "/api/history/:path*", "/api/chat/:path*"],
};
