"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { Streamdown } from "streamdown";
import { code as codePlugin } from "@streamdown/code";
import { math as mathPlugin } from "@streamdown/math";
import { mermaid as mermaidPlugin } from "@streamdown/mermaid";
import { cjk as cjkPlugin } from "@streamdown/cjk";


interface ChatContentProps {
  messages: any[];
  isStreaming: boolean;
  resolvedTheme?: string;
}

/**
 * 助手：渲染单条消息内容 (使用顶级 Streamdown 引擎)
 */
function MessageRenderer({ content }: { content: any }) {
  // 注入全量插件，开启极致渲染体验
  const plugins = {
    code: codePlugin,
    math: mathPlugin,
    mermaid: mermaidPlugin,
    cjk: cjkPlugin
  };

  // 处理文本消息
  if (typeof content === 'string') {
    return (
      <Streamdown 
        plugins={plugins}
        controls={{
          code: { copy: true, download: true },
          mermaid: { download: true }
        }}
        lineNumbers={true}
        className="prose dark:prose-invert max-w-none text-[15px] leading-7"
      >
        {content}
      </Streamdown>
    );
  }
  
  // 处理 AI SDK v6 多 Part 结构
  if (Array.isArray(content)) {
    return (
      <div className="space-y-5">
        {content.map((part, i) => {
          if (part.type === 'text') {
            return (
              <Streamdown 
                key={i} 
                plugins={plugins}
                controls={{
                  code: { copy: true, download: true },
                  mermaid: { download: true }
                }}
                lineNumbers={true}
                className="prose dark:prose-invert max-w-none text-[15px] leading-7"
              >
                {part.text}
              </Streamdown>
            );
          }
          if (part.type === 'image') {
            return (
              <div key={i} className="relative group/img max-w-sm">
                <img 
                  src={part.image} 
                  className="rounded-2xl border border-black/5 dark:border-white/5 shadow-sm transition-transform duration-300 group-hover/img:scale-[1.01]" 
                  alt="AI Context" 
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }
  
  return null;
}

export function ChatContent({ messages, isStreaming }: ChatContentProps) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 pb-32">
      {messages.length === 0 ? (
        <div className="h-[55vh] flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-400/5 rounded-[2rem] flex items-center justify-center relative shadow-[0_0_20px_rgba(66,133,244,0.1)]">
             <Bot className="w-12 h-12 text-[#4285f4]" />
             <div className="absolute inset-0 bg-blue-400/20 rounded-[2rem] animate-ping duration-[3000ms]" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-black/90 dark:text-white/90 tracking-tight">
               您好，我是您的智能伙伴
            </h1>
            <p className="text-black/40 dark:text-white/40 text-lg max-w-md mx-auto leading-relaxed">
               我可以帮您写代码、分析数据，或者仅仅是陪您聊天。今天您有什么想法？
            </p>
          </div>
        </div>
      ) : (
        messages.map((m, i) => (
          <div 
            key={m.id || i} 
            className={cn(
              "group flex gap-6 md:gap-10 items-start px-2 py-4 rounded-3xl transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.01]",
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-sm transition-all",
              m.role === 'user' 
                ? "bg-[#333537] text-white rotate-[-3deg]" 
                : "bg-[#4285f4] text-white shadow-[#4285f4]/20 shadow-lg rotate-[3deg]"
            )}>
              {m.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[12px] text-black/40 dark:text-white/40 uppercase tracking-[0.2em] select-none">
                   {m.role === 'user' ? 'USER' : 'GEMINI AI'}
                </span>
                <span className="text-black/10 dark:text-white/10 text-[10px]">|</span>
                <span className="text-[11px] text-black/30 dark:text-white/20">
                   {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-black/90 dark:text-white/90 leading-relaxed font-normal">
                 <MessageRenderer content={m.content} />
              </div>
            </div>
          </div>
        ))
      )}
      
      {isStreaming && (
        <div className="flex gap-6 md:gap-10 items-center pl-4 text-blue-500/60 dark:text-blue-400/40">
           <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(66,133,244,0.4)]" />
           <div className="text-[13px] font-medium tracking-wide">
              正在响应中...
           </div>
        </div>
      )}
    </div>
  );
}

export default ChatContent;
