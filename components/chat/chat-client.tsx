"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import ChatContent from "./chat-content";
import ChatInputArea from "./input-area";
import ChatSidebar from "./sidebar";
import { useTheme } from "@/app/providers";
import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";

/**
 * 助手：标准化历史消息格式
 */
const standardizeMessage = (m: any) => ({
  id: m.id || String(Math.random()),
  role: m.role || "user",
  content: m.content || "",
  createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
  parts: [{ type: 'text', text: m.content || "" }]
});

export function ChatClient({ initialSession }: { initialSession?: any }) {
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [localInput, setLocalInput] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { resolvedTheme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 仅使用 useChat 管理消息数组状态
  const { messages, setMessages, stop } = useChat();

  /**
   * 选择历史会话
   */
  const handleChatSelect = async (selectedId: string) => {
    setChatId(selectedId);
    try {
      const res = await fetch(`/api/history/messages/${selectedId}`, { credentials: "same-origin" });
      if (res.ok) {
        const history = await res.json();
        setMessages(history.map(standardizeMessage));
      }
    } catch (error) {
      console.error("Fetch History Error:", error);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  /**
   * 开启新对话
   */
  const handleNewChat = () => {
    setChatId(undefined);
    setMessages([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  /**
   * 核心流提交逻辑 (线性、无深度嵌套)
   */
  const onFormSubmitHandler = async (e: React.FormEvent, value: string) => {
    e.preventDefault();
    const content = value || localInput;
    if (!content.trim() && files.length === 0 && !isStreaming) return;

    const aiMsgId = `ai-${Date.now()}`;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      parts: [{ type: 'text', text: content }],
      createdAt: new Date()
    } as any;

    const initialAiMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      parts: [],
      createdAt: new Date()
    } as any;

    setMessages((prev: any[]) => [...prev, userMessage, initialAiMessage]);
    setLocalInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ messages: [...messages, userMessage], chatId, metadata: { isOnline } })
      });

      if (!response.ok) throw new Error("Sync failure");

      const serverChatId = response.headers.get("X-Chat-Id");
      if (serverChatId && chatId !== serverChatId) setChatId(serverChatId);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        text += decoder.decode(value, { stream: true });
        setMessages((prev: any[]) => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: text, parts: [{ type: 'text', text }] } : m
        ));
      }
    } catch (err) {
      console.error("[Runtime Stream Failure]", err);
      setMessages((prev: any[]) => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: "⚠️ 抱歉，连接服务器时发生错误。请稍后再试。" } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafd] dark:bg-[#0e0e0e] overflow-hidden relative">
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        currentChatId={chatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Mobile Header Toggle */}
        {!isSidebarOpen && (
          <div className="lg:hidden absolute top-4 left-4 z-40">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white/80 dark:bg-[#1e1f20]/80 backdrop-blur-md rounded-full shadow-sm border border-black/5 dark:border-white/5 text-black/60 dark:text-white/60 hover:bg-white dark:hover:bg-[#1e1f20] transition-all"
            >
              <LayoutGrid className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-8" ref={scrollRef}>
          <ChatContent 
            messages={messages} 
            isStreaming={isStreaming} 
            resolvedTheme={resolvedTheme} 
          />
        </div>

        <div className="px-4 pb-6 pt-2">
          <ChatInputArea 
            input={localInput}
            setInput={setLocalInput}
            onFormSubmit={onFormSubmitHandler}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            files={files}
            setFiles={setFiles}
            isLoading={isStreaming}
            stop={stop}
          />
        </div>
      </main>
    </div>
  );
}
