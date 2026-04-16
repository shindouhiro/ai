import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  /** 页脚版权文案 */
  footerText?: string;
}

/**
 * 认证页面通用布局 — 统一极光背景、噪点、网格
 */
export default function AuthLayout({
  children,
  footerText = "© 2026 QUANTUM AI · ADVANCED NEURAL INTERFACE",
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505] selection:bg-violet-500/30">
      {/* 极光背景特效 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />

      {/* 噪点全屏装饰 */}
      <div className="absolute inset-0 bg-[url('https://graining.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

      {/* 现代网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        {children}
      </div>

      {/* 页脚版权 */}
      <footer className="absolute bottom-8 left-0 right-0 text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-zinc-500 text-[10px] font-medium tracking-[0.2em] uppercase">
          {footerText}
        </p>
      </footer>
    </main>
  );
}
