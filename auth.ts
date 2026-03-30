import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";

// 注意：不使用 DrizzleAdapter，强制纯 JWT 模式。
// 使用 Adapter 时 NextAuth 内部会切换成 database session 策略，
// 与 session: { strategy: "jwt" } 的配置冲突，导致每次刷新会话失效。
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers.filter((p: any) => {
      // 在 v5 beta 中，GitHub 等提供者是函数形式
      return p.id !== "credentials" && (p as any).name !== "Credentials";
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 先尝试从数据库查询用户
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (user && user.password) {
          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
            };
          }
        }

        // 临时测试账号（数据库中不存在时兜底）
        if (
          credentials.email === "admin@example.com" &&
          credentials.password === "admin123"
        ) {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@example.com",
          };
        }

        return null;
      },
    }),
  ],
});
