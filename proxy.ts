import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 直接使用统一的 auth 实例作为 proxy
// 这确保了 Middleware (Proxy) 和 Server Components 使用完全相同的解析逻辑和密钥
export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // 调试日志：输出真正的 Session 状态
  console.log(`[proxy] Target: ${pathname}, Session Found: ${!!session}`);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
