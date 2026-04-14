import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import authConfig from "./auth.config";
import Credentials from "next-auth/providers/credentials";

function isCredentialsProvider(
  provider: unknown
): provider is { id: "credentials" } {
  if (!provider || typeof provider !== "object") return false;
  const id = (provider as { id?: unknown }).id;
  return id === "credentials";
}

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
    ...authConfig.providers.filter((provider) => !isCredentialsProvider(provider)),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 临时测试账号（数据库异常时也可用于基本联调）
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

        let user:
          | {
              id: string;
              name: string | null;
              email: string | null;
              password: string | null;
            }
          | undefined;

        try {
          // 仅查询登录流程必要字段，避免历史库结构不一致时读取无关列失败
          const rows = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              password: users.password,
            })
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);
          user = rows[0];
        } catch (error) {
          const code = (error as { code?: string })?.code;
          const schemaMismatchCodes = new Set(["42P01", "42703"]);
          console.error("[auth] Credentials lookup failed", {
            code,
            message: error instanceof Error ? error.message : String(error),
            hint: schemaMismatchCodes.has(code ?? "")
              ? "database schema may be outdated; run Drizzle migrations"
              : undefined,
          });
          return null;
        }

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

        return null;
      },
    }),
  ],
});
