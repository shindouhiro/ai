import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#050505]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[150px] rounded-full animate-pulse-slow" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        <LoginForm />
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-8 left-0 right-0 text-center opacity-30 hover:opacity-100 transition-opacity">
        <p className="text-zinc-400 text-xs font-light tracking-widest uppercase">
          &copy; 2026 AI Assistant &bull; Secure Authentication System
        </p>
      </div>
    </main>
  );
}
