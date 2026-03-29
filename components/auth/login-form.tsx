"use client";

import { useActionState } from "react";
import { authenticate } from "@/lib/actions";
import { LogIn, Mail, Lock, AlertCircle, LayoutGrid } from "lucide-react";
import { socialLogin } from "@/lib/actions";

export default function LoginForm() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-2">
          <LogIn className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">欢迎回来</h1>
        <p className="text-zinc-400">登入您的 AI Assistant 账号</p>
      </div>

      <form action={dispatch} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="email"
              name="email"
              placeholder="邮箱地址 (admin@example.com)"
              required
              className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 text-white"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="password"
              name="password"
              placeholder="密码 (admin123)"
              required
              className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600 text-white"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl animate-shake">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isPending ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              登入
              <LogIn className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0a0a0a] px-4 text-zinc-500">或者通过以下方式</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => socialLogin("github")}
          className="flex items-center justify-center gap-3 px-4 py-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <LayoutGrid className="w-5 h-5" />
          使用第三方账号登录
        </button>
      </div>

      <p className="text-center text-zinc-500 text-sm">
        还没有账号? <span className="text-blue-500 hover:underline cursor-pointer">联系管理员</span>
      </p>
    </div>
  );
}
