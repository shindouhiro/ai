"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import { LogIn, Mail, Lock, AlertCircle, LayoutGrid, Sparkles } from "lucide-react";
import { socialLogin } from "@/lib/actions";
import Link from "next/link";

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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium ml-1 text-black/70 dark:text-white/60">
            电子邮箱
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30 group-focus-within:text-violet-500 transition-colors" />
            <input
              name="email"
              type="email"
              placeholder="hello@example.com"
              required
              className="w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-sm font-medium text-black/70 dark:text-white/60">
              密码
            </label>
            <a href="#" className="text-xs text-violet-500 hover:text-violet-400 transition-colors">忘记密码?</a>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30 group-focus-within:text-violet-500 transition-colors" />
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          disabled={isPending}
          type="submit"
          className="relative mt-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden group"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              登入账号 <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="flex items-center gap-4 my-2 px-2">
          <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
          <span className="text-xs font-medium text-black/30 dark:text-white/20 uppercase tracking-widest leading-none">
            或者
          </span>
          <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
        </div>

        <button
          type="button"
          onClick={() => socialLogin("github")}
          className="flex items-center justify-center gap-3 px-4 py-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <LayoutGrid className="w-5 h-5" />
          使用第三方账号登录
        </button>
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
