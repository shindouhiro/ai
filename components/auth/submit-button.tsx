"use client";

import type { LucideIcon } from "lucide-react";

interface SubmitButtonProps {
  isPending: boolean;
  label: string;
  icon: LucideIcon;
}

export function SubmitButton({ isPending, label, icon: Icon }: SubmitButtonProps) {
  return (
    <button
      disabled={isPending}
      type="submit"
      className="relative mt-2 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 overflow-hidden group"
    >
      {isPending ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          {label} <Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </button>
  );
}
