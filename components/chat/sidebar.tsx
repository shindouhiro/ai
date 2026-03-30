"use client";

import { useEffect, useState } from "react";
import { deleteChat } from "@/lib/actions";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, LogOut, LayoutGrid, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function ChatSidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  isOpen,
  setIsOpen,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/history/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Fetch Sessions Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [currentChatId]); // 当 ID 变化时刷新列表以更新标题或最后活跃时间

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这段对话吗？")) {
      await deleteChat(id);
      fetchSessions();
      if (currentChatId === id) onNewChat();
    }
  };

  return (
    <>
      {/* 侧边栏主体 (玻璃拟态风格) */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white/60 dark:bg-[#0a0a0a]/80 backdrop-blur-2xl border-r border-black/5 dark:border-white/10 z-50 transition-all duration-500 ease-in-out flex flex-col shadow-2xl overflow-hidden",
          isOpen ? "w-[280px]" : "w-0 -translate-x-full"
        )}
      >
        {/* 页眉 */}
        <div className="p-6 pb-2">
          <button
            onClick={onNewChat}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-violet-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            开启新对话
          </button>
        </div>

        {/* 历史对话列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-black/5 dark:scrollbar-thumb-white/5">
          {loading ? (
            <div className="flex flex-col gap-4 p-4 opacity-30">
              <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse" />
              <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse w-3/4" />
              <div className="h-10 bg-black/10 dark:bg-white/10 rounded-xl animate-pulse w-1/2" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-black/20 dark:text-white/20 p-8 text-center italic">
              <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">暂无对话记录</p>
            </div>
          ) : (
            sessions.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={cn(
                  "group relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all border border-transparent",
                  currentChatId === chat.id
                    ? "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 font-medium"
                    : "hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/40"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  currentChatId === chat.id ? "bg-violet-500 animate-pulse" : "bg-black/10 dark:bg-white/10"
                )} />
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm truncate leading-tight">{chat.title || "新对话"}</span>
                  <span className="text-[10px] opacity-40 mt-0.5">
                    {format(new Date(chat.updatedAt || chat.createdAt), "MM-dd HH:mm", { locale: zhCN })}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-500/60 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 页脚: 工具与账号 */}
        <div className="p-4 mt-auto border-t border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-black dark:text-white truncate">智能对话助手</p>
              <p className="text-[10px] text-black/40 dark:text-white/40">v1.2.0 • Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 切换手柄 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-[60] p-1.5 bg-violet-600 text-white rounded-full shadow-2xl transition-all duration-500 hover:scale-110",
          isOpen ? "left-[265px]" : "left-4"
        )}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* 遮罩层 (移动端) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity lg:hidden"
        />
      )}
    </>
  );
}
