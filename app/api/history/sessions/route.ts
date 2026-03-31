import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 获取当前用户的聊天会话列表 (JSON API 版)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
       console.log('[API Sessions] ❌ No user session found during GET');
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.query.chats.findMany({
      where: eq(chats.userId, session.user.id),
      orderBy: [desc(chats.updatedAt)],
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Fetch Sessions API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
