"use client";

import type { LucideIcon } from "lucide-react";

interface AuthInputProps {
  name: string;
  type: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  /** 可选：标签右侧的额外内容，如"忘记密码"链接 */
  labelExtra?: React.ReactNode;
}

export function AuthInput({
  name,
  type,
  label,
  placeholder,
  icon: Icon,
  labelExtra,
}: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <label className="text-sm font-medium text-black/70 dark:text-white/60">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30 group-focus-within:text-violet-500 transition-colors" />
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required
          className="w-full pl-11 pr-4 py-4 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white"
        />
      </div>
    </div>
  );
}
