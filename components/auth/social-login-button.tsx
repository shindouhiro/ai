"use client";

import { LayoutGrid } from "lucide-react";
import { socialLogin } from "@/lib/actions/auth";

interface SocialLoginButtonProps {
  label?: string;
}

export function SocialLoginButton({ label = "使用第三方账号登录" }: SocialLoginButtonProps) {
  return (
    <button
      type="button"
      onClick={() => socialLogin("github")}
      className="flex items-center justify-center gap-3 px-4 py-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
    >
      <LayoutGrid className="w-5 h-5" />
      {label}
    </button>
  );
}
