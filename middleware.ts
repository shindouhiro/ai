import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 定义无需鉴权的公共路由
  const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  // 如果用户未开启会话且尝试访问非公共路由
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  // 如果用户已登录且访问登录或注册页，跳转主页
  if (isLoggedIn && isPublicRoute) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
