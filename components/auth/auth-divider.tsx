"use client";

interface AuthDividerProps {
  text: string;
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-4 my-2 px-2">
      <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
      <span className="text-xs font-medium text-black/30 dark:text-white/20 uppercase tracking-widest leading-none">
        {text}
      </span>
      <div className="flex-1 h-[1px] bg-black/5 dark:bg-white/5" />
    </div>
  );
}
