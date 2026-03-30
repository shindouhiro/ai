import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export default {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      
      // 调试日志：输出登录用户信息
      if (isLoggedIn) {
        console.log(`[proxy] ✅ User Authenticated: ${auth?.user?.name} (${auth?.user?.email}) at ${pathname}`);
      } else {
        console.log(`[proxy] ❌ Unauthenticated request to ${pathname}`);
      }
      console.log(`[proxy] Request details: ${JSON.stringify({
        pathname,
        isLoggedIn,
        cookies: request.cookies.getAll().map(c => c.name)
      })}`);

      const isPublicRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
      
      if (!isLoggedIn && !isPublicRoute) {
        return false; // 重定向至登录
      }
      
      if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL("/", nextUrl));
      }
      
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      // 这里的逻辑至关重要：确保刷新后 token 里的内容依然存在
      return { ...token, ...user };
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: (token.id || token.sub) as string,
          name: token.name as string,
          email: token.email as string,
        } as any;
      }
      return session;
    },
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = { id: "1", name: "Admin User", email: "admin@example.com" };
        const passwordsMatch = credentials?.email === "admin@example.com" && credentials?.password === "admin123";
        
        if (passwordsMatch) {
          console.log(`[auth] ✅ DB match success for user: ${user.email}`);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } else {
          console.log(`[auth] ❌ Password mismatch for user: ${credentials?.email}`);
        }
        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
