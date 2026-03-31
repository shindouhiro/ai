import { auth } from "@/auth";
import { ChatClient } from "@/components/chat/chat-client";
import { redirect } from "next/navigation";

/**
 * 根页面：服务器端组件
 * 强制动态渲染，确保每次刷新都从服务器获取最新 Session
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();

  // 如果没有 session，由中间件 (proxy.ts) 重定向到 /login
  // 但我们在这里也做一层保护
  if (!session) {
    redirect("/login");
  }

  return <ChatClient initialSession={session} />;
}
