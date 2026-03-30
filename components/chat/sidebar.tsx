"use client";

import { useEffect, useState } from "react";
import { deleteChat } from "@/lib/actions";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, LayoutGrid, Bot, Clock, History, Settings, ExternalLink, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
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
  }, [currentChatId]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这段对话吗？")) {
      await deleteChat(id);
      fetchSessions();
      if (currentChatId === id) onNewChat();
    }
  };

  const getTimeLabel = (date: Date) => {
    if (isToday(date)) return "今天";
    if (isYesterday(date)) return "昨天";
    return format(date, "MM月dd日", { locale: zhCN });
  };

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
            onClick={() => setIsOpen(!isOpen)}
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
        <div className="p-3 mt-auto border-t border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <button className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70 transition-all", !isOpen && "justify-center px-0")}>
              <History className="w-5 h-5 shrink-0" />
              {isOpen && <span className="text-[13px] font-medium">活动纪录</span>}
            </button>
            <button className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-black/70 dark:text-white/70 transition-all", !isOpen && "justify-center px-0")}>
              <Settings className="w-5 h-5 shrink-0" />
              {isOpen && <span className="text-[13px] font-medium">设置</span>}
            </button>
          </div>
          {/* {isOpen && (
            <div className="mt-4 px-4 py-2 text-[11px] text-black/40 dark:text-white/30 flex items-center gap-2">
               北京，中国 • 基于 Gemini 风格
            </div>
          )} */}
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
}
