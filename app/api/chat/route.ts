import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { chatMessages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 助手：提取消息内容的字符串表示
 */
function extractMessageContent(message: any): string {
  if (typeof message.content === 'string' && message.content) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || "")
      .join('');
  }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text ||'').join('');
  }
  return message.content ? JSON.stringify(message.content) : "";
}

/**
 * 助手：对消息进行标准化处理，防止 convertToModelMessages 报错
 */
function normalizeMessages(messages: any[]): any[] {
  if (!Array.isArray(messages)) return [];
  return messages.map(m => {
    // 强制将 content 为数组的情况转为字符串
    let content = m.content;
    if (Array.isArray(content)) {
       content = content.filter((p: any) => p.type === 'text').map((p: any) => p.text || "").join('');
    }
    // 补齐缺失的 content 属性
    return {
      ...m,
      content: content || ""
    };
  });
}

/**
 * 核心聊天 API 端点
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { messages, metadata: rootMetadata, chatId: providedChatId } = body;

    if (!messages || !Array.isArray(messages)) {
       return new Response(JSON.stringify({ error: "Messages is required and must be an array" }), { status: 400 });
    }

    const lastMessage = messages?.[messages.length - 1];
    const metadata = lastMessage?.metadata || rootMetadata;
    const isOnline = metadata?.isOnline ?? false;
    
    // 关键修正：在调用核心转换函数前进行规整
    const normalizedMessages = normalizeMessages(messages);
    const modelMessages = await convertToModelMessages(normalizedMessages);

    let currentChatId = providedChatId;

    // 1. 自动创建会话
    if (!currentChatId && session?.user?.id && messages.length > 0) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      const textContent = extractMessageContent(firstUserMessage);
      const title = textContent.substring(0, 30) || '新对话';
      const [newChat] = await db.insert(chats).values({ userId: session.user.id, title }).returning();
      currentChatId = newChat.id;
    }

    // 2. 保存用户最后一条消息 (即使是空内容或零件也序列化后保存)
    if (currentChatId && lastMessage && lastMessage.role === 'user') {
      const contentToSave = typeof lastMessage.content === 'string' && lastMessage.content !== ""
        ? lastMessage.content 
        : (lastMessage.content && lastMessage.content.length > 0 ? JSON.stringify(lastMessage.content) : "");

      let finalContent = contentToSave;
      if (!finalContent && lastMessage.parts) {
        finalContent = JSON.stringify(lastMessage.parts);
      }

      await db.insert(chatMessages).values({ chatId: currentChatId, role: 'user', content: finalContent || "" });
      await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, currentChatId));
    }

    const result = streamText({
      model: defaultModel,
      messages: modelMessages,
      system: '你是一个专业的 AI 助手。' + 
              (isOnline ? ' 你有联网搜索能力。' : '当前为离线模式。'),
      tools: isOnline ? {
        search: tool({
          description: '从互联网获取实时信息。',
          inputSchema: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) return { error: 'TAVILY_API_KEY is missing' };
            try {
              const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
              });
              const data = await response.json();
              return data.results?.map((res: any) => `[${res.title}](${res.url})\n${res.content}`).join('\n\n') || "未搜索到结果。";
            } catch (err) { return '搜索失败。'; }
          },
        }),
      } : {},
      stopWhen: isOnline ? stepCountIs(5) : stepCountIs(1),
      onFinish: async ({ text }) => {
        if (currentChatId) {
          await db.insert(chatMessages).values({ chatId: currentChatId, role: 'assistant', content: text || "" });
        }
      }
    });

    return result.toUIMessageStreamResponse({
      headers: currentChatId ? { 'X-Chat-Id': currentChatId } : undefined,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
