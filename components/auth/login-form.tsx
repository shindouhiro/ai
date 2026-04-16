"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions/auth";
import { LogIn, Mail, Lock } from "lucide-react";
import Link from "next/link";
import {
  AuthInput,
  AuthErrorAlert,
  SubmitButton,
  AuthDivider,
  SocialLoginButton,
} from "@/components/auth";

export default function LoginForm() {
  const [errorMessage, action, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="w-full max-w-md p-8 md:p-10 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
          欢迎回来
        </h1>
        <p className="text-sm text-black/50 dark:text-white/40">
          登入您的 AI Assistant 账号以继续
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
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
          label="密码"
          placeholder="••••••••"
          icon={Lock}
          labelExtra={
            <a href="#" className="text-xs text-violet-500 hover:text-violet-400 transition-colors">
              忘记密码?
            </a>
          }
        />

        <AuthErrorAlert message={errorMessage} />

        <SubmitButton isPending={isPending} label="登入账号" icon={LogIn} />

        <AuthDivider text="或者" />

        <SocialLoginButton label="使用第三方账号登录" />
      </form>

      <p className="mt-8 text-center text-sm text-black/40 dark:text-white/30">
        还没有账号?{" "}
        <Link
          href="/register"
          className="text-violet-500 hover:text-violet-400 font-semibold transition-colors decoration-dotted hover:underline underline-offset-4"
        >
          立即注册
        </Link>
      </p>
    </div>
  );
}
