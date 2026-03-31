import RegisterForm from "@/components/auth/register-form";
import { Bot, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* 炫酷渐变背景 */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 blur-[120px] opacity-20 dark:opacity-30">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-violet-600 rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-[35%] h-[35%] bg-cyan-500 rounded-full animate-pulse-slow delay-1000" />
      </div>

      <div className="flex flex-col items-center w-full max-w-lg">
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-3 animate-in slide-in-from-top-4 duration-700">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-900/40 border border-white/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
              智能助手 <Sparkles className="w-4 h-4 text-violet-500 fill-violet-500" />
            </h2>
            <p className="text-xs text-black/40 dark:text-white/40 tracking-widest uppercase font-medium">
              Next-Gen AI Workspace
            </p>
          </div>
        </div>

        <RegisterForm />

        <footer className="mt-12 text-center text-[10px] text-black/30 dark:text-white/20 font-medium tracking-widest uppercase opacity-50 space-y-2">
          <p>© 2026 Intelligent AI Assistant</p>
          <div className="flex items-center gap-4 justify-center">
            <a href="#" className="hover:text-violet-500 transition-colors">条款</a>
            <div className="w-1 h-1 rounded-full bg-current" />
            <a href="#" className="hover:text-violet-500 transition-colors">隐私</a>
            <div className="w-1 h-1 rounded-full bg-current" />
            <a href="#" className="hover:text-violet-500 transition-colors">帮助</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
