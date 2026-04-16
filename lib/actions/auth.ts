"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

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
