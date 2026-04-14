"use server";

import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users, chats, chatMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * 身份验证 (登录)
 */
export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const res = await signIn("credentials", Object.fromEntries(formData));
    return res;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "邮箱或密码错误";
        default:
          return "登录过程中发生错误";
      }
    }
    throw error;
  }
}

/**
 * 用户注册
 */
export async function registerUser(
  prevState: string | undefined,
  formData: FormData
) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return "请填写所有必填项";
  }

  try {
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const existingUser = existingUsers[0];

    if (existingUser) {
      return "该邮箱已被注册";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return "注册失败，请稍后再试";
  }

  redirect("/login");
}

/**
 * 社交登录
 */
export async function socialLogin(provider: string) {
  await signIn(provider);
}

// --- 聊天记录相关 Actions ---

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
