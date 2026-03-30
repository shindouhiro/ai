import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chats, chatMessages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    // 校验权限
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.chatId, chatId),
      orderBy: [asc(chatMessages.createdAt)],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch Messages API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
