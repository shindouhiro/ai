'use client';
 
import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { Send, Bot, ImageIcon, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertFileListToFileUIParts } from 'ai';
 
interface ChatInputAreaProps {
  input: string;
  setInput: (val: string) => void;
  onFormSubmit: (e: React.FormEvent, value: string) => void;
  files: any[];
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
  isOnline: boolean;
  setIsOnline: (val: boolean) => void;
  isLoading: boolean;
  stop: () => void;
}
 
/**
 * 助手：输入区域组件
 * 使用 memo 包装，并配合上层 useCallback，极大减少打字时的非必要重渲染
 */
const ChatInputArea = memo(({
  input,
  setInput,
  onFormSubmit,
  files,
  setFiles,
  isOnline,
  setIsOnline,
  isLoading,
  stop
}: ChatInputAreaProps) => {
  const [internalInput, setInternalInput] = useState(input || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
 
  // 同步外部 input 变更 (符合 rerender-derived-state-no-effect 的设计思路
  // 但由于这里需要本地镜像提升响应速度，保留本地 state 同步逻辑)
  useEffect(() => {
    if (input !== internalInput) {
      setInternalInput(input || '');
    }
  }, [input]);
 
  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [internalInput]);
 
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInternalInput(val); 
    setInput?.(val);       
  }, [setInput]);
 
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!internalInput.trim() && files.length === 0) return;
      onFormSubmit(e as any, internalInput);
      setInternalInput('');
    }
  }, [internalInput, files.length, onFormSubmit]);
 
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!internalInput.trim() && files.length === 0) return;
    onFormSubmit(e, internalInput);
    setInternalInput('');
  }, [internalInput, files.length, onFormSubmit]);
 
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const parts = await convertFileListToFileUIParts(e.target.files);
      setFiles(prev => [...prev, ...parts]);
      e.target.value = '';
    }
  }, [setFiles]);
 
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== index));
  }, [setFiles]);
 
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0 opacity-100 pointer-events-auto">
       <form 
         onSubmit={handleSubmit} 
         className="relative group/input flex flex-col bg-[#f0f4f9] dark:bg-[#1e1f20] rounded-[1.75rem] transition-all border border-transparent focus-within:bg-[#f8fafd] dark:focus-within:bg-[#131314] focus-within:border-[#dde3ea] dark:focus-within:border-[#333537] focus-within:shadow-[0_4px_10px_rgba(0,0,0,0.05)]"
       >
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-b border-black/5 dark:border-white/5">
                {files.map((file, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden shadow-sm">
                    <img src={file.url} className="w-full h-full object-cover" alt="prev" />
                    <button 
                      type="button" 
                      onClick={() => removeFile(i)} 
                      className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
 
          <div className="flex items-end px-3 py-2 min-h-[56px] relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
              accept="image/*" 
            />
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all mb-1 shrink-0"
            >
                <ImageIcon className="w-6 h-6" />
            </button>
            
            <textarea
              ref={textareaRef}
              value={internalInput}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="输入提示词..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none px-3 py-3 text-[16px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/30 resize-none min-h-[56px] leading-[1.5] selection:bg-blue-200 dark:selection:bg-blue-800"
              disabled={isLoading}
              autoFocus
            />
 
            <div className="flex items-center gap-1.5 mb-1 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsOnline(!isOnline)}
                  className={cn(
                    "p-3 rounded-full transition-all",
                    isOnline 
                      ? "text-[#4285f4] bg-[#4285f4]/10 shadow-[0_0_10px_rgba(66,133,244,0.2)]" 
                      : "text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <Bot className="w-6 h-6" />
                </button>
                
                {isLoading ? (
                  <button 
                    type="button" 
                    onClick={() => stop()} 
                    className="p-3 bg-[#d93025] text-white rounded-full shadow-lg hover:bg-[#b02a1e] transition-all"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={!internalInput.trim() && files.length === 0} 
                    className={cn(
                      "p-3 rounded-full transition-all",
                      (!internalInput.trim() && files.length === 0) 
                        ? "text-black/10 dark:text-white/10" 
                        : "text-[#4285f4] dark:text-[#8ab4f8] hover:bg-[#4285f4]/10 dark:hover:bg-[#8ab4f8]/10"
                    )}
                  >
                    <Send className="w-6 h-6" />
                  </button>
                )}
            </div>
          </div>
       </form>
    </div>
  );
});
 
ChatInputArea.displayName = "ChatInputArea";
 
export default ChatInputArea;
