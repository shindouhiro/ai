"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { chats, chatMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * 获取当前用户的聊天列表
 */
export async function getChatSessions() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    return await db.query.chats.findMany({
      where: eq(chats.userId, session.user.id),
      orderBy: [desc(chats.updatedAt)],
    });
  } catch (error) {
    console.error("Fetch Chats Error:", error);
    return [];
  }
}

/**
 * 获取指定聊天的消息记录
 */
export async function getChatMessages(chatId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    // 校验权限：只能查看自己的聊天记录
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat || chat.userId !== session.user.id) return [];

    return await db.query.chatMessages.findMany({
      where: eq(chatMessages.chatId, chatId),
      orderBy: [chatMessages.createdAt],
    });
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    return [];
  }
}

/**
 * 创建新聊天
 */
export async function createChat(title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const [newChat] = await db
      .insert(chats)
      .values({
        userId: session.user.id,
        title: title || "新对话",
      })
      .returning();

    revalidatePath("/");
    return newChat;
  } catch (error) {
    console.error("Create Chat Error:", error);
    throw error;
  }
}

/**
 * 删除聊天
 */
export async function deleteChat(chatId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    await db.delete(chats).where(eq(chats.id, chatId));
    revalidatePath("/");
  } catch (error) {
    console.error("Delete Chat Error:", error);
    throw error;
  }
}

/**
 * 保存消息
 */
export async function saveMessage(chatId: string, role: "user" | "assistant", content: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await db.insert(chatMessages).values({
      chatId,
      role,
      content,
    });

    // 同时更新聊天的 updatedAt
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));
  } catch (error) {
    console.error("Save Message Error:", error);
  }
}
