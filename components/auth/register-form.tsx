"use client";

import { useActionState } from "react";
import { registerUser } from "@/lib/actions/auth";
import { User, Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import {
  AuthInput,
  AuthErrorAlert,
  SubmitButton,
  AuthDivider,
  SocialLoginButton,
} from "@/components/auth";

export default function RegisterForm() {
  const [errorMessage, action, isPending] = useActionState(
    registerUser,
    undefined
  );

  return (
    <div className="w-full max-w-md p-8 md:p-10 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          加入我们
        </h1>
        <p className="text-sm text-black/50 dark:text-white/40">
          立即注册以跨平台同步您的数据与设置
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <AuthInput
          name="name"
          type="text"
          label="用户名"
          placeholder="您的称呼"
          icon={User}
        />

        <AuthInput
          name="email"
          type="email"
          label="电子邮箱"
          placeholder="hello@example.com"
          icon={Mail}
        />

        <AuthInput
          name="password"
          type="password"
          label="设置密码"
          placeholder="••••••••"
          icon={Lock}
        />

        <AuthErrorAlert message={errorMessage} />

        <SubmitButton isPending={isPending} label="快速注册" icon={LogIn} />

        <AuthDivider text="或其他方式" />

        <SocialLoginButton label="使用第三方账号继续" />
      </form>

      <p className="mt-8 text-center text-sm text-black/40 dark:text-white/30">
        已有账号?{" "}
        <Link
          href="/login"
          className="text-violet-500 hover:text-violet-400 font-semibold transition-colors decoration-dotted hover:underline underline-offset-4"
        >
          立即登录
        </Link>
      </p>
    </div>
  );
}
