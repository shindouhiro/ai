import { streamText, tool, stepCountIs } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { chatMessages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

/**
 * 助手：提取消息内容 (遵循 Good Taste：消除特殊情况)
 */
function getCoreMessageContent(message: any): any {
  if (!message) return "";
  
  // 如果是字符串，直接返回
  if (typeof message.content === 'string') return message.content;
  
  // 如果是多 Part 数组，完整保留结构 (AI SDK v6 规范)
  if (Array.isArray(message.content)) {
    return message.content;
  }

  // AI SDK v3 的历史遗留 parts 兼容
  if (Array.isArray(message.parts)) {
    return message.parts.map((p: any) => p.text || "").join('');
  }
  
  return message.content || "";
}

/**
 * 核心聊天 API 端点 (精简后的 Linus 风格)
 */
export const POST = auth(async (req) => {
  if (!req.auth?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { messages, metadata: rootMetadata, chatId: providedChatId } = body;

    if (!messages || !Array.isArray(messages)) {
       return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    const isOnline = lastMessage?.metadata?.isOnline ?? rootMetadata?.isOnline ?? false;
    
    // 映射 CoreMessages (保持品味，支持图片附件)
    const modelMessages: any[] = messages.map(m => ({
       role: m.role || 'user',
       content: getCoreMessageContent(m)
    }));

    let currentChatId = providedChatId;

    // 1. 自动创建会话 (预置数据库记录，保证原子性)
    if (!currentChatId && req.auth.user.id) {
      const [newChat] = await db.insert(chats).values({ 
        userId: req.auth.user.id, 
        title: String(messages[0]?.content || '新对话').substring(0, 30)
      }).returning();
      currentChatId = newChat.id;
    }

    // 2. 提前入库用户消息 (防止断流导致的数据丢失)
    if (currentChatId && lastMessage?.role === 'user') {
      await db.insert(chatMessages).values({ 
        chatId: currentChatId, 
        role: 'user', 
        content: String(lastMessage.content || "") 
      });
      await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, currentChatId));
    }

    // 3. 流式生成与助手消息同步
    const systemPrompt = isOnline
      ? `你是一个专业的 AI 助手，当前已开启联网搜索模式。当用户询问实时信息（天气、新闻、股价、最新事件等）时，你必须调用 search 工具获取最新数据，然后基于搜索结果回答用户问题。不要凭记忆回答实时性问题。`
      : `你是一个专业的 AI 助手，当前处于离线模式，仅使用已有知识回答问题。`;

    const result = streamText({
      model: defaultModel,
      messages: modelMessages,
      system: systemPrompt,
      stopWhen: isOnline ? stepCountIs(3) : stepCountIs(1),
      tools: isOnline ? {
        search: tool({
          description: '搜索互联网获取实时信息，包括天气、新闻、最新事件等。',
          inputSchema: z.object({ query: z.string().describe('搜索关键词') }),
          execute: async ({ query }) => {
            const apiKey = process.env.TAVILY_API_KEY;
            const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ api_key: apiKey, query, max_results: 5 }),
            });
            const data = await response.json();
            return data.results?.map((res: any) => `[${res.title}](${res.url})\n${res.content}`).join('\n\n');
          },
        }),
      } : {},
      onFinish: async ({ text }) => {
        if (currentChatId) {
          await db.insert(chatMessages).values({ 
            chatId: currentChatId, 
            role: 'assistant', 
            content: text || "" 
          });
        }
      }
    });

    // 返回最简洁的文本流响应 (支持 X-Chat-Id 透传)
    return result.toTextStreamResponse({
      headers: {
        'X-Chat-Id': currentChatId || "",
        'Access-Control-Expose-Headers': 'X-Chat-Id'
      },
    });

  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
});
