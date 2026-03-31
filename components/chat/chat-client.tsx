'use client';

import { useSession, signOut } from 'next-auth/react';
import { useChat } from '@ai-sdk/react';
import { Streamdown } from 'streamdown';
import { User, Bot, Paperclip, X, Sun, Moon, ArrowDown, Wand2, Square, LogOut, Command, ChevronDown, Image as ImageIcon, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { useStreamdownPlugins } from '@/hooks/use-streamdown-plugins';
import ChatSidebar from '@/components/chat/sidebar';
import dynamic from 'next/dynamic';

// 动态载入输入组件
const ChatInputArea = dynamic(() => import('@/components/chat/input-area'), { 
  ssr: false,
  loading: () => (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      <div className="w-full h-[56px] bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-[1.75rem] animate-pulse-subtle" />
    </div>
  )
});

function standardizeMessage(msg: any): any {
  let content = msg.content;
  let attachments = undefined;

  if (typeof content === 'string' && (content.startsWith('[') || content.startsWith('{'))) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        attachments = parsed.filter((p: any) => p.type === 'image' || p.image || p.url).map((p: any) => ({ url: p.url || p.image || p.data }));
        content = parsed.filter((p: any) => p.type === 'text' || p.text).map((p: any) => p.text || "").join('');
      } else if (parsed.text) {
        content = parsed.text;
      }
    } catch (e) { }
  } else if (Array.isArray(content)) {
    attachments = content.filter((p: any) => p.type === 'image' || p.image || p.url).map((p: any) => ({ url: p.url || p.image || p.data }));
    content = content.filter((p: any) => p.type === 'text' || p.text).map((p: any) => p.text || "").join('');
  }

  return {
    id: msg.id || Math.random().toString(36).substring(7),
    role: msg.role as any,
    content: String(content || ""),
    experimental_attachments: attachments,
    createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date()
  };
}

interface ChatClientProps {
  initialSession: any;
}

export default function ChatClient({ initialSession }: ChatClientProps) {
  const { data: sessionData } = useSession();
  const session = sessionData || initialSession;

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatId, setChatId] = useState<string | undefined>(undefined);

  // 状态变量汇总
  const [localInput, setLocalInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  // 仅使用 useChat 管理消息数组
  const { messages, setMessages, stop } = useChat();

  const handleChatSelect = async (selectedId: string) => {
    setChatId(selectedId);
    try {
      const res = await fetch(`/api/history/messages/${selectedId}`, {
        credentials: 'same-origin'
      });
      if (res.ok) {
        const history = await res.json();
        setMessages(history.map(standardizeMessage));
      }
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setChatId(undefined);
    setMessages([]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  /**
   * 终极方案：手动流式读取逻辑
   */
  const onFormSubmitHandler = async (e: React.FormEvent, explicitValue: string) => {
    e.preventDefault();
    const messageContent = explicitValue || localInput;
    if (!messageContent.trim() && files.length === 0 && !isStreaming) return;

    // 1. 构造用户消息和占位 AI 消息 (必须带上 parts 以适配 SDK v6)
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;
    
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: messageContent,
      parts: [{ type: 'text', text: messageContent }],
      experimental_attachments: files.map(f => ({ url: f.url, name: f.name, contentType: 'image/jpeg' })),
      createdAt: new Date()
    } as any;

    const initialAiMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      parts: [],
      createdAt: new Date()
    } as any;

    // 2. 更新 UI 并开启流状态
    setMessages((prev: any[]) => [...prev, userMessage, initialAiMessage]);
    setLocalInput('');
    setFiles([]);
    setIsStreaming(true);

    try {
      // 3. 直接 Fetch 原始流 (加固：显式带上凭证以通过 proxy 校验)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chatId,
          metadata: { isOnline }
        })
      });

      if (!response.ok) throw new Error('API Response Error');

      // 4. 解析 Header 中的新 ChatId
      const newChatId = response.headers.get('X-Chat-Id');
      if (newChatId && chatId !== newChatId) setChatId(newChatId);

      // 5. 逐块读取并更新消息内容
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;

          // 实时更新 AI 消息的内容
          setMessages(prev => 
            prev.map(m => m.id === aiMsgId ? { ...m, content: accumulatedContent } : m)
          );
        }
      }
    } catch (err) {
      console.error('[Manual Stream Error]', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const isLoading = isStreaming;
  const { scrollRef, isAtBottom, handleScroll, scrollToBottom } = useChatScroll(messages, isStreaming ? 'streaming' : 'ready');
  const streamdownPlugins = useStreamdownPlugins(resolvedTheme);

  return (
    <main suppressHydrationWarning className="relative min-h-screen flex bg-white dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] transition-colors duration-300 font-sans selection:bg-blue-100 dark:selection:bg-blue-900 w-full">
      <ChatSidebar
        currentChatId={chatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className={cn(
        "flex-1 flex flex-col items-center relative transition-all duration-300 ease-in-out h-screen",
        isSidebarOpen && session ? "md:pl-[300px]" : "md:pl-[68px]"
      )}>
        <header className="w-full h-16 shrink-0 px-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md z-30">
          <header className="flex items-center gap-3">
            <div className="md:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><Command className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full cursor-pointer hover:bg-black/10 transition-all">
              <span className="text-[14px] font-medium tracking-tight">Gemini Advanced</span>
              <ChevronDown className="w-4 h-4 opacity-40" />
            </div>
          </header>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-[#f9ab00]" /> : <Moon className="w-5 h-5 text-[#4285f4]" />)}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a142f4] to-[#4285f4] flex items-center justify-center text-white text-[12px] font-bold shadow-md cursor-pointer hover:scale-110 transition-all ring-2 ring-white dark:ring-[#131314] ring-offset-2 ring-offset-transparent outline-none">
              {mounted ? (session?.user?.name?.[0]?.toUpperCase() || 'U') : null}
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 w-full max-w-4xl overflow-y-auto px-6 py-4 md:px-12 space-y-12 scrollbar-none"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-start justify-center pt-20">
              <h2 className="text-[56px] font-medium leading-none mb-10 bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] text-transparent bg-clip-text animate-gradient">
                你好，{session?.user?.name?.split(' ')[0] || '朋友'}
              </h2>
              <p className="text-[28px] font-medium text-black/40 dark:text-white/40 mb-12">我今天可以如何帮您？</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {["帮忙制定一个学习计划", "解释一下量子力学", "帮我写一个工作周报模板", "提供一些旅行建议"].map((text, i) => (
                  <div key={i} onClick={() => setLocalInput(text)} className="p-5 bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#dde3ea] dark:hover:bg-[#282a2c] rounded-[1.5rem] cursor-pointer transition-all flex flex-col justify-between h-[180px]">
                    <p className="text-[14px] font-medium leading-relaxed">{text}</p>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#131314] flex items-center justify-center self-end shadow-sm">
                      <Plus className="w-5 h-5 text-black/60 dark:text-white/60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message: any, idx: number) => (
              <div
                key={`${message.id}-${idx}`}
                className={cn(
                  "group flex gap-6 md:gap-10 items-start max-w-none animate-in fade-in duration-700",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white dark:ring-[#131314] shadow-sm",
                  message.role === 'user' ? "bg-[#a142f4]" : "bg-transparent"
                )}>
                  {message.role === 'user' ? (
                    session?.user?.name?.[0]?.toUpperCase() || 'U'
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] animate-pulse-slow" />
                  )}
                </div>

                <div className={cn(
                  "flex-1 min-w-0 flex flex-col gap-2",
                  message.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}>
                  <div className="text-[16px] leading-[1.6] tracking-wide w-full prose dark:prose-invert max-w-none font-normal">
                    {message.role === 'user' ? (
                      <div className="flex flex-col gap-3">
                        {message.experimental_attachments?.map((f: any, i: number) => (
                          <img src={f.url} key={i} className="max-w-[150px] rounded-xl" alt="attachment" />
                        ))}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ) : (
                      <Streamdown
                        shikiTheme={['github-light', 'github-dark']}
                        isAnimating={isLoading && idx === messages.length - 1}
                        plugins={streamdownPlugins}
                      >
                        {message.content}
                      </Streamdown>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && !(messages[messages.length - 1] as any)?.content && (
            <div className="flex gap-6 md:gap-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] animate-spin-slow grow-0 shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full animate-pulse-subtle" />
                <div className="h-4 w-2/3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse-subtle delay-75" />
              </div>
            </div>
          )}
        </div>

        <footer className="w-full shrink-0 flex justify-center pb-6 md:pb-10 pt-4 bg-transparent relative z-20">
          {!isAtBottom && messages.length > 0 && (
            <button type="button" onClick={scrollToBottom} className="absolute -top-16 left-1/2 -translate-x-1/2 p-2.5 bg-white dark:bg-[#1e1f20] border border-black/10 dark:border-white/10 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all text-blue-600">
              <ArrowDown className="w-5 h-5" />
            </button>
          )}

          <ChatInputArea
            input={localInput}
            setInput={setLocalInput}
            onFormSubmit={onFormSubmitHandler}
            files={files}
            setFiles={setFiles}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            isLoading={isLoading}
            stop={stop}
          />
        </footer>
      </div>
    </main>
  );
}
