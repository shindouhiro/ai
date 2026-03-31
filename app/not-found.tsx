import Link from "next/link";
 
export const dynamic = "force-dynamic";
 
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0a0a0a]">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-4xl">404</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">页面未找到</h1>
          <p className="text-black/60 dark:text-white/60">
            抱歉，您请求的页面不存在或已被移除。
          </p>
        </div>
        <Link 
          href="/" 
          className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
