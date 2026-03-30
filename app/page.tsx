'use client';

import { useSession, signOut } from 'next-auth/react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, convertFileListToFileUIParts } from 'ai';
import { Streamdown } from 'streamdown';
import { Send, User, Bot, Paperclip, X, Sun, Moon, ArrowDown, Wand2, Mic, Square, LogOut, Sparkles, Command, ChevronDown, Check, Image as ImageIcon, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useChatScroll } from '../hooks/use-chat-scroll';
import { useStreamdownPlugins } from '../hooks/use-streamdown-plugins';
import ChatSidebar from '@/components/chat/sidebar';

/**
 * AI 聊天演示页面 - Gemini 风格重构
 * 极致清爽的 Material Design 处理
 */
export default function ChatPage() {
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatId, setChatId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);

  const { messages, setMessages, status, sendMessage, error, stop } = useChat({
    transport,
    body: { chatId },
    onResponse: (response) => {
      const headerChatId = response.headers.get('X-Chat-Id');
      if (headerChatId && chatId !== headerChatId) {
        setChatId(headerChatId);
      }
    }
  });

  const handleChatSelect = async (selectedId: string) => {
    setChatId(selectedId);
    try {
      const res = await fetch(`/api/history/messages/${selectedId}`);
      if (res.ok) {
        const history = await res.json();
        setMessages(history.map((msg: any) => {
          let content = msg.content;
          try {
            if (content.startsWith('[') || content.startsWith('{')) {
              content = JSON.parse(content);
            }
          } catch (e) { }
          return { id: msg.id, role: msg.role as any, content, createdAt: new Date(msg.createdAt) };
        }));
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

  const getMessageText = (message: any) => {
    if (typeof message.content === 'string' && message.content) return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
    }
    if (Array.isArray(message.content)) {
      return message.content.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
    }
    return '';
  };

  const [input, setInput] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && files.length === 0) return;
    sendMessage({ text: input, files, metadata: { isOnline } } as any);
    setInput('');
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isLoading = status === 'submitted' || status === 'streaming';
  const { scrollRef, isAtBottom, handleScroll, scrollToBottom } = useChatScroll(messages, status);
  const streamdownPlugins = useStreamdownPlugins(resolvedTheme);

  return (
    <main suppressHydrationWarning className="relative min-h-screen flex bg-white dark:bg-[#131314] text-[#1f1f1f] dark:text-[#e3e3e3] transition-colors duration-300 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">

      {session && (
        <ChatSidebar
          currentChatId={chatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
      )}

      {/* 主聊天区域 - 让出侧边栏空间 */}
      <div className={cn(
        "flex-1 flex flex-col items-center relative transition-all duration-300 ease-in-out h-screen",
        isSidebarOpen && session ? "md:pl-[300px]" : "md:pl-[68px]"
      )}>

        {/* Top Navigation - Gemini 风格顶部极其精简 */}
        <header className="w-full h-16 shrink-0 px-6 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#131314]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"><Command className="w-5 h-5" /></button>
            </div>
            {/* <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full cursor-pointer hover:bg-black/10 transition-all">
              <span className="text-[14px] font-medium tracking-tight">Gemini Advanced</span>
              <ChevronDown className="w-4 h-4 opacity-40" />
            </div> */}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun className="w-5 h-5 text-[#f9ab00]" /> : <Moon className="w-5 h-5 text-[#4285f4]" />)}
            </button>

            {/* User Profile */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a142f4] to-[#4285f4] flex items-center justify-center text-white text-[12px] font-bold shadow-md cursor-pointer hover:scale-110 transition-all ring-2 ring-white dark:ring-[#131314] ring-offset-2 ring-offset-transparent">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* 聊天内容区 - Gemini 是流式平铺，没有气泡 */}
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

              {/* 建议卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                {[
                  "帮忙制定一个学习计划", "解释一下量力力学", "帮我写一个工作周报模板", "提供一些旅行建议"
                ].map((text, i) => (
                  <div key={i} onClick={() => setInput(text)} className="p-5 bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#dde3ea] dark:hover:bg-[#282a2c] rounded-[1.5rem] cursor-pointer transition-all flex flex-col justify-between h-[180px]">
                    <p className="text-[14px] font-medium leading-relaxed">{text}</p>
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#131314] flex items-center justify-center self-end shadow-sm">
                      <Plus className="w-5 h-5 text-black/60 dark:text-white/60" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "group flex gap-6 md:gap-10 items-start max-w-none animate-in fade-in duration-700",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* 头像 - Gemini 用户在右，AI在左 */}
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

                {/* 内容 - 无气泡扁平化设计 */}
                <div className={cn(
                  "flex-1 min-w-0 flex flex-col gap-2",
                  message.role === 'user' ? "items-end text-right" : "items-start text-left"
                )}>
                  <div className={cn(
                    "text-[16px] leading-[1.6] tracking-wide w-full prose dark:prose-invert max-w-none font-normal",
                    message.role === 'user' ? "bg-[#f0f4f9] dark:bg-[#1e1f20] p-4 rounded-2xl md:bg-transparent md:p-0 md:rounded-none" : ""
                  )}>
                    {message.role === 'user' ? (
                      <div className="flex flex-col gap-3">
                        <div className="whitespace-pre-wrap">{getMessageText(message)}</div>
                      </div>
                    ) : (
                      <Streamdown
                        shikiTheme={['github-light', 'github-dark']}
                        isAnimating={status === 'streaming'}
                        plugins={streamdownPlugins}
                      >
                        {getMessageText(message)}
                      </Streamdown>
                    )}
                  </div>

                  {/* 操作按钮 - 仅在 AI 消息下方显示 */}
                  {message.role === 'assistant' && !isLoading && (
                    <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"><Bot className="w-4 h-4 opacity-40" /></button>
                      <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"><Send className="w-4 h-4 opacity-40" /></button>
                      {/* 更多 Gemini 风格小图标 */}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && !getMessageText(messages[messages.length - 1]) && (
            <div className="flex gap-6 md:gap-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4285f4] via-[#9b72cb] to-[#d96570] animate-spin-slow grow-0 shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full animate-pulse-subtle" />
                <div className="h-4 w-2/3 bg-black/5 dark:bg-white/5 rounded-full animate-pulse-subtle delay-75" />
              </div>
            </div>
          )}
        </div>

        {/* 底部输入框 - Gemini 经典的胶囊设计 */}
        <footer className="w-full max-w-4xl px-4 md:px-6 pb-6 md:pb-10 pt-4 bg-transparent relative mt-auto">

          {!isAtBottom && messages.length > 0 && (
            <button onClick={scrollToBottom} className="absolute -top-16 left-1/2 -translate-x-1/2 p-2.5 bg-white dark:bg-[#1e1f20] border border-black/10 dark:border-white/10 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
              <ArrowDown className="w-5 h-5 text-blue-600" />
            </button>
          )}

          <div className="max-w-4xl mx-auto">
            <div className="relative group/input flex flex-col bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-[1.75rem] transition-all border border-transparent focus-within:bg-[#f8fafd] dark:focus-within:bg-[#131314] focus-within:border-[#dde3ea] dark:focus-within:border-[#333537] focus-within:shadow-[0_4px_10px_rgba(0,0,0,0.05)]">

              {/* 图片附件展示区域 */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3">
                  {files.map((file, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                      <img src={file.url} className="w-full h-full object-cover" alt="prev" />
                      <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full"><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end px-3 py-2 min-h-[56px]">
                <input type="file" ref={fileInputRef} onChange={async (e) => {
                  if (e.target.files) {
                    const parts = await convertFileListToFileUIParts(e.target.files);
                    setFiles(prev => [...prev, ...parts]);
                    e.target.value = '';
                  }
                }} className="hidden" multiple accept="image/*" />

                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all mb-1">
                  <ImageIcon className="w-6 h-6" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入提示词..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-3 py-3 text-[16px] placeholder:text-black/40 dark:placeholder:text-white/30 resize-none min-h-[56px] leading-[1.5]"
                  disabled={isLoading}
                />

                <div className="flex items-center gap-1.5 mb-1">
                  <button
                    onClick={() => setIsOnline(!isOnline)}
                    className={cn(
                      "p-3 rounded-full transition-all",
                      isOnline ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                    title="在线搜索"
                  >
                    <Bot className="w-6 h-6" />
                  </button>

                  {isLoading ? (
                    <button onClick={() => stop()} className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all"><Square className="w-5 h-5 fill-current" /></button>
                  ) : (
                    <button
                      onClick={() => handleSubmit()}
                      disabled={!input.trim() && files.length === 0}
                      className={cn(
                        "p-3 rounded-full transition-all",
                        (!input.trim() && files.length === 0) ? "text-black/10 dark:text-white/10" : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      )}
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 法律/隐私申明 - Gemini 风格 */}

          </div>
        </footer>
      </div>
    </main>
  );
}
