'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, convertFileListToFileUIParts } from 'ai';
import { Streamdown } from 'streamdown';
import { Send, User, Bot, Paperclip, X, Sun, Moon, ArrowDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useChatScroll } from '../hooks/use-chat-scroll';
import { useStreamdownPlugins } from '../hooks/use-streamdown-plugins';

/**
 * AI 聊天演示页面
 * 展示了 Vercel AI SDK 的封装使用以及 Streamdown 渲染器的集成
 */
export default function ChatPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, status, sendMessage, error } = useChat({
    transport,
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

  const getMessageImages = (message: any) => {
    if (!Array.isArray(message.parts)) return [];
    return message.parts.filter((part: any) => part.type === 'image');
  };

  const [input, setInput] = useState('');
  const [files, setFiles] = useState<any[]>([]); // Using any[] here to avoid import issues or complex types if needed, or follow FileUIPart
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newParts = await convertFileListToFileUIParts(e.target.files);
      setFiles((prev) => [...prev, ...newParts]);
      // Clear input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && files.length === 0) return;

    sendMessage({
      text: input,
      files: files
    });

    setInput('');
    setFiles([]);
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  const { scrollRef, isAtBottom, handleScroll, scrollToBottom } = useChatScroll(messages, status);
  const streamdownPlugins = useStreamdownPlugins(resolvedTheme);

  return (
    <main suppressHydrationWarning className="relative min-h-screen flex flex-col items-center justify-center p-0 md:p-4 bg-white dark:bg-[#0a0a0a] text-black dark:text-white overflow-hidden transition-colors duration-300">
      {/* 炫酷背景渐变 */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.08),transparent),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.08),transparent)] dark:bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.15),transparent),radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.15),transparent)]" />

      {/* 玻璃拟态聊天容器 */}
      <div suppressHydrationWarning className="w-full max-w-4xl h-screen md:h-[85vh] flex flex-col bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl border-x-0 border-y-0 md:border md:border-black/5 md:dark:border-white/[0.08] shadow-2xl rounded-none md:rounded-3xl overflow-hidden shadow-black/5 dark:shadow-black/20">

        {/* 页眉 */}
        <header suppressHydrationWarning className="px-4 py-4 md:px-8 md:py-6 border-b border-black/5 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-black/90 dark:text-white">智能对话助手</h1>
              <p className="text-xs text-black/40 dark:text-white/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                基于 Vercel AI SDK & Streamdown
              </p>
            </div>
          </div>

          {/* 皮肤切换按钮 */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-all group"
            title="切换主题"
          >
            {mounted ? (
              resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              )
            ) : (
              <div className="w-5 h-5" />
            )}
          </button>
        </header>

        {/* 聊天消息区域 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          suppressHydrationWarning
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10 space-y-6 md:space-y-10 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent relative"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 dark:opacity-30 select-none">
              <Bot className="w-16 h-16 mb-4 text-black dark:text-white" />
              <p className="text-lg text-black dark:text-white">准备好开始对话了吗？</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "group flex gap-3 md:gap-6 max-w-[95%] md:max-w-[90%] message-enter",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* 头像 */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex shrink-0 items-center justify-center shadow-md",
                  message.role === 'user'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                    : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5 text-cyan-400" />
                  )}
                </div>

                {/* 气泡 */}
                <div className={cn(
                  "flex flex-col gap-2 min-w-0 w-full", // 允许完全展开以容纳宽表格，min-w-0 防止 flex 挤压
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl transition-all duration-300 w-full", // w-full 允许拉伸
                    message.role === 'user'
                      ? "w-fit max-w-full bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 rounded-tr-none"
                      : "bg-transparent text-black/90 dark:text-white/90 prose dark:prose-invert max-w-none prose-p:leading-relaxed overflow-x-auto scrollbar-thin"
                  )}>
                    {message.role === 'user' ? (
                      <div className="flex flex-col gap-3">
                        {getMessageImages(message).map((part: any, i: number) => (
                          <img
                            key={i}
                            src={part.url || part.image}
                            alt="Uploaded"
                            className="max-w-full rounded-lg border border-white/10"
                          />
                        ))}
                        <div className="whitespace-pre-wrap break-words">{getMessageText(message)}</div>
                      </div>
                    ) : (
                      /* 使用 Streamdown 进行 Markdown 渲染 */
                      <div className={cn(
                        "max-w-full overflow-x-auto pb-2 transition-all",
                        isLoading && messages.indexOf(message) === messages.length - 1 && "is-streaming streamdown-content-animated"
                      )}>
                        <Streamdown
                          shikiTheme={['github-light', 'github-dark']}
                          className="docs-content"
                          isAnimating={status === 'streaming'}
                          plugins={streamdownPlugins}
                        >
                          {getMessageText(message)}
                        </Streamdown>
                      </div>
                    )}
                  </div>
                  <time className="text-[10px] uppercase text-black/30 dark:text-white/30 tracking-widest px-1">
                    {message.role === 'user' ? '用户' : '智能助手'}
                  </time>
                </div>
              </div>
            ))
          )}
          {isLoading && !getMessageText(messages[messages.length - 1]) && (
            <div className="flex gap-3 md:gap-6 mr-auto message-enter">
              <div className="w-10 h-10 rounded-xl flex shrink-0 items-center justify-center bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div className="flex-1 flex flex-col gap-3 py-2">
                <div className="gemini-loading-bar" />
                <div className="gemini-loading-bar opacity-40 w-[60%]" />
              </div>
            </div>
          )}

          {/* 回到底部按钮 (当用户手动向上滚动且有新消息时显示) */}
          {!isAtBottom && messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all z-20 flex items-center gap-2 text-xs font-medium px-4 animate-in fade-in slide-in-from-bottom-2"
            >
              <ArrowDown className="w-4 h-4" />
              回到最新消息
            </button>
          )}
        </div>

        {/* 输入框区域 */}
        <footer suppressHydrationWarning className="p-4 md:p-8 border-t border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-black/20">
          <form
            onSubmit={handleSubmit}
            className="group relative flex flex-col gap-4 transition-all duration-300"
          >
            {/* 图片预览 */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2">
                {files.map((file, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group/item">
                    <img
                      src={file.url}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="absolute left-2 p-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={files.length > 0 ? "描述一下这些图片..." : "发送消息..."}
                className="w-full h-14 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl pl-14 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-black/20 dark:placeholder:text-white/20 text-black dark:text-white text-sm md:text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && files.length === 0)}
                className="absolute right-2 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-black/5 dark:disabled:bg-white/5 disabled:text-black/20 dark:disabled:text-white/20 text-white rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          <p className="mt-4 text-center text-[10px] text-black/20 dark:text-white/20 tracking-wider">
            支持图片上传与实时分析 • 基于 Vercel AI SDK 统一接口
          </p>
        </footer>
      </div>
    </main>
  );
}
