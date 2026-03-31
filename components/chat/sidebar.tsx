"use client";
 
import { useEffect, useState, useCallback, memo } from "react";
import { deleteChat } from "@/lib/actions";
import { Plus, MessageSquare, Trash2, LayoutGrid, History, Settings, MoreVertical, LogOut, User, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/app/providers";
 
interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}
 
/**
 * 助手：侧边栏组件
 * 使用 React.memo 避免在主对话区域流式更新时导致侧边栏重渲染
 */
const ChatSidebar = memo(({
  currentChatId,
  onChatSelect,
  onNewChat,
  isOpen,
  setIsOpen,
}: ChatSidebarProps) => {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
 
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/history/sessions", {
        credentials: 'same-origin'
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Fetch Sessions Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    fetchSessions();
  }, [currentChatId, fetchSessions]);
 
  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这段对话吗？")) {
      await deleteChat(id);
      fetchSessions();
      if (currentChatId === id) onNewChat();
    }
  }, [currentChatId, fetchSessions, onNewChat]);
 
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);
 
  const toggleSidebar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);
 
  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-[#f0f4f9] dark:bg-[#1e1f20] z-[60] transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
          isOpen ? "w-[260px] md:w-[300px]" : "w-0 md:w-[68px]"
        )}
      >
        {/* Top Header - Minimal Gemini style */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-black/60 dark:text-white/60"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
        </div>
 
        {/* New Chat Button */}
        <div className="px-3 mb-6">
          <button
            onClick={onNewChat}
            className={cn(
              "flex items-center gap-3 h-12 transition-all rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/80 dark:text-white/80",
              isOpen ? "w-full px-5" : "w-12 px-3 overflow-hidden justify-center"
            )}
          >
            <Plus className="w-5 h-5 shrink-0" />
            {isOpen && <span className="text-sm font-medium whitespace-nowrap">新对话</span>}
          </button>
        </div>
 
        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-none">
          {isOpen && <p className="px-4 text-[13px] font-bold text-black/40 dark:text-white/40 mb-2">最近</p>}
 
          {loading ? (
            <div className={cn("space-y-4 px-2", !isOpen && "hidden")}>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-black/5 dark:bg-white/5 rounded-full animate-pulse" />
              ))}
            </div>
          ) : (
            sessions.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={cn(
                  "group relative flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-all",
                  currentChatId === chat.id
                    ? "bg-[#dde3ea] dark:bg-[#333537] text-black dark:text-white"
                    : "hover:bg-[#e9eef6] dark:hover:bg-[#282a2c] text-black/70 dark:text-white/70"
                )}
              >
                <div className="shrink-0 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                {isOpen && (
                  <>
                    <span className="flex-1 text-[13px] font-medium truncate">{chat.title || "新对话"}</span>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
 
        {/* Footer Area - Minimal */}
        <div className="p-3 mt-auto border-t border-black/5 dark:border-white/5 space-y-4">
          <div className="space-y-1">
            <button className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70 transition-all", !isOpen && "justify-center px-0")}>
              <History className="w-5 h-5 shrink-0" />
              {isOpen && <span className="text-[13px] font-medium">活动纪录</span>}
            </button>
            <button className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70 transition-all", !isOpen && "justify-center px-0")}>
              <Settings className="w-5 h-5 shrink-0" />
              {isOpen && <span className="text-[13px] font-medium">设置</span>}
            </button>
            <button 
              onClick={toggleTheme}
              className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70 transition-all", !isOpen && "justify-center px-0")}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
              {isOpen && <span className="text-[13px] font-medium">{theme === 'dark' ? '浅色模式' : '深色模式'}</span>}
            </button>
          </div>
 
          {/* User Profile & Logout */}
          <div className={cn(
            "pt-2 border-t border-black/5 dark:border-white/5",
            !isOpen && "flex flex-col items-center"
          )}>
            <div className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02]",
              !isOpen && "w-10 h-10 p-0 justify-center rounded-full"
            )}>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black/80 dark:text-white/80 truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-black/40 dark:text-white/30 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => signOut()}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 mt-2 rounded-full text-rose-500 hover:bg-rose-500/10 transition-all",
                !isOpen && "justify-center px-0 mt-4"
              )}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {isOpen && <span className="text-[13px] font-medium">退出登录</span>}
            </button>
          </div>
        </div>
      </aside>
 
      {/* Mobile Drawer Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/10 backdrop-blur-xs z-50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
    </>
  );
});
 
ChatSidebar.displayName = "ChatSidebar";
 
export default ChatSidebar;
