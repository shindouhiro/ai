import LoginForm from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505] selection:bg-blue-500/30">
      {/* 极光背景特效 */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
      
      {/* 噪点全屏装饰 */}
      <div className="absolute inset-0 bg-[url('https://graining.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      
      {/* 现代网格背景 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 mb-4 flex items-center justify-center">
             <div className="w-6 h-6 rounded-full bg-white/20 animate-pulse" />
           </div>
           <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">欢迎回来</h1>
           <p className="text-zinc-500 text-sm">登录您的智能助手账号</p>
        </div>
        
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <LoginForm />
        </div>
      </div>

      {/* 页脚版权 */}
      <footer className="absolute bottom-8 left-0 right-0 text-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-zinc-500 text-[10px] font-medium tracking-[0.2em] uppercase">
          &copy; 2026 QUANTUM AI &bull; ADVANCED NEURAL INTERFACE
        </p>
      </footer>
    </main>
  );
}
