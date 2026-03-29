'use client';

import { useSession, signOut } from 'next-auth/react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, convertFileListToFileUIParts } from 'ai';
import { Streamdown } from 'streamdown';
import { Send, User, Bot, Paperclip, X, Sun, Moon, ArrowDown, Wand2, Mic, Square, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { useChatScroll } from '../hooks/use-chat-scroll';
import { useStreamdownPlugins } from '../hooks/use-streamdown-plugins';

/**
 * AI 聊天演示页面
 * 展示了 Vercel AI SDK 的封装使用以及 Streamdown 渲染器的集成
 */
export default function ChatPage() {
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 防止水合不匹配
  useEffect(() => {
    setMounted(true);
  }, []);

  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), []);
  const { messages, status, sendMessage, error, stop } = useChat({
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
  const [isOnline, setIsOnline] = useState(false);
  const [isDeepThinking, setIsDeepThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5.4');
  const [files, setFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 Textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      files: files,
      // 可以在此处扩展 metadata，如联网/深度思考状态
      metadata: {
        isOnline,
        isDeepThinking,
        model: selectedModel
      }
    } as any);

    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
                {session?.user?.name || '访客'} 基于 Vercel AI SDK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            {/* 退出登录按钮 */}
            <button
              onClick={() => signOut()}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-500/20 transition-all"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
                  "flex flex-col gap-2 min-w-0 w-full",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl transition-all duration-300 w-full",
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
        <footer suppressHydrationWarning className="p-4 md:p-6 pb-6 md:pb-10 border-t border-black/5 dark:border-white/[0.08] bg-black/5 dark:bg-black/20">
          <form
            onSubmit={handleSubmit}
            className="group relative flex flex-col gap-3 transition-all duration-300 max-w-4xl mx-auto"
          >
            {/* 功能开关与模型选择 */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnline(!isOnline)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isOnline
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
                      : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-current opacity-50")} />
                  联网搜索
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeepThinking(!isDeepThinking)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    isDeepThinking
                      ? "bg-violet-500/10 border-violet-500/50 text-violet-600 dark:text-violet-400 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]"
                      : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", isDeepThinking ? "bg-violet-500 animate-pulse" : "bg-current opacity-50")} />
                  深度思考
                </button>
              </div>
            </div>

            {/* 图片预览 */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                {files.map((file, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-xl overflow-hidden border border-black/10 dark:border-white/20 group/item shadow-sm">
                    <img
                      src={file.url}
                      className="w-full h-full object-cover"
                      alt="preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl shadow-black/[0.02] dark:shadow-black/20 p-2 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
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
                className="p-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all mb-1"
                title="上传文件"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <button
                type="button"
                className="p-3 text-black/40 dark:text-white/40 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all mb-1"
                title="提示词增强"
                onClick={() => {
                  if (input.trim()) {
                    setInput(prev => `请优化以下需求，使其更专业、更清晰：\n\n${prev}`);
                  }
                }}
              >
                <Wand2 className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={files.length > 0 ? "描述一下这些图片..." : "描述你的需求或问题..."}
                rows={1}
                className="flex-1 max-h-[200px] bg-transparent border-none focus:ring-0 outline-none p-3 text-black dark:text-white text-base resize-none placeholder:text-black/20 dark:placeholder:text-white/20"
                disabled={isLoading}
              />

              <button
                type="button"
                className="p-3 text-black/40 dark:text-white/40 hover:text-indigo-500 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-all mb-1"
                title="语音输入"
              >
                <Mic className="w-5 h-5" />
              </button>

              {isLoading ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all shadow-lg active:scale-95 mb-1 ml-1"
                  title="停止生成"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && files.length === 0}
                  className={cn(
                    "p-3 rounded-xl transition-all shadow-lg mb-1 ml-1",
                    (!input.trim() && files.length === 0)
                      ? "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 shadow-none cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95"
                  )}
                  title="发送消息"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
          <p className="mt-4 text-center text-[10px] text-black/30 dark:text-white/30 font-medium tracking-widest uppercase opacity-50">
            Intelligent AI Assistant • Multimodal Support
          </p>
        </footer>
      </div>
    </main>
  );
}
