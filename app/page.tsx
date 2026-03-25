'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Streamdown } from 'streamdown';
import "streamdown/styles.css";
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 类名合并助手
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * AI 聊天演示页面
 * 展示了 Vercel AI SDK 的封装使用以及 Streamdown 渲染器的集成
 */
export default function ChatPage() {
  const { messages, status, sendMessage, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const getMessageText = (message: any) => {
    if (typeof message.content === 'string' && message.content) return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((part: any) => part.type === 'text')
        .map((part: any) => part.text)
        .join('');
    }
    return '';
  };

  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  const scrollRef = useRef<HTMLDivElement>(null);

  // 消息自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a] text-white overflow-hidden">
      {/* 炫酷背景渐变 */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.15),transparent),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.15),transparent)]" />

      {/* 玻璃拟态聊天容器 */}
      <div className="w-full max-w-4xl h-[85vh] flex flex-col bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-2xl rounded-3xl overflow-hidden">

        {/* 页眉 */}
        <header className="px-8 py-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">智能对话助手</h1>
              <p className="text-xs text-white/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                基于 Vercel AI SDK & Streamdown
              </p>
            </div>
          </div>
        </header>

        {/* 聊天消息区域 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
              <Bot className="w-16 h-16 mb-4" />
              <p className="text-lg">准备好开始对话了吗？</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "group flex gap-6 max-w-[90%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* 头像 */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex shrink-0 items-center justify-center shadow-md",
                  message.role === 'user'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                    : "bg-white/5 border border-white/10"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                {/* 气泡 */}
                <div className={cn(
                  "flex flex-col gap-2 flex-1 min-w-0", // min-w-0 是允许 flex 项目正常溢出隐藏的关键
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl transition-all duration-300 w-fit max-w-full", // w-fit 控制宽度跟随内容，max-w-full 限制最大宽度
                    message.role === 'user'
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 rounded-tr-none"
                      : "bg-white/5 text-white/90 border border-white/5 rounded-tl-none prose prose-invert prose-p:leading-relaxed overflow-x-auto scrollbar-thin"
                  )}>
                    {message.role === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{getMessageText(message)}</div>
                    ) : (
                      /* 使用 Streamdown 进行 Markdown 渲染 */
                      <div className="max-w-full overflow-x-auto pb-2">
                        <Streamdown
                          animated
                          isAnimating={isLoading && messages.indexOf(message) === messages.length - 1}
                        >
                          {getMessageText(message)}
                        </Streamdown>
                      </div>
                    )}
                  </div>
                  <time className="text-[10px] uppercase text-white/30 tracking-widest px-1">
                    {message.role === 'user' ? '用户' : '智能助手'}
                  </time>
                </div>
              </div>
            ))
          )}
          {isLoading && !getMessageText(messages[messages.length - 1]) && (
            <div className="flex gap-6 mr-auto">
              <div className="w-10 h-10 rounded-xl flex shrink-0 items-center justify-center bg-white/5 border border-white/10">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 输入框区域 */}
        <footer className="p-8 border-t border-white/[0.08] bg-black/20">
          <form
            onSubmit={handleSubmit}
            className="group relative flex items-center transition-all duration-300"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="发送消息..."
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-white/20 text-white rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="mt-4 text-center text-[10px] text-white/20 tracking-wider">
            对话记录将通过封装的 Vercel AI 提供者实现流式分发
          </p>
        </footer>
      </div>
    </main>
  );
}
