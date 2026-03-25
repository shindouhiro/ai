import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export function useChatScroll(
  messages: any[],
  status: string
): {
  scrollRef: RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  handleScroll: () => void;
  scrollToBottom: () => void;
} {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 检查是否在底部
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // 允许 100 像素的误差，提高容错性
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsAtBottom(true);
    }
  }, []);

  // 消息自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && isAtBottom && (status === 'streaming' || status === 'submitted')) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom, status]);

  // 当进入加载状态且当前已经在底部时，锁定到底部
  useEffect(() => {
    if (status === 'submitted' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setIsAtBottom(true);
    }
  }, [status]);

  return { scrollRef, isAtBottom, handleScroll, scrollToBottom };
}
