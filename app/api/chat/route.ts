import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { chatMessages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 核心聊天 API 端点
 * 已集成历史记录自动保存
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { messages, metadata: rootMetadata, chatId: providedChatId } = body;

    // 关键修复：从最后一条消息或根目录提取 metadata
    const lastMessage = messages?.[messages.length - 1];
    const metadata = lastMessage?.metadata || rootMetadata;

    const isOnline = metadata?.isOnline ?? false;
    const isDeepThinking = metadata?.isDeepThinking ?? false;

    // AI SDK 6.0 中 convertToModelMessages 是异步的
    const modelMessages = await convertToModelMessages(messages);

    let currentChatId = providedChatId;

    // 如果未提供 chatId 且用户已登录，则自动创建新会话 (以第一条用户消息为标题)
    if (!currentChatId && session?.user?.id && messages.length > 0) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      let title = '新对话';
      
      if (typeof firstUserMessage?.content === 'string') {
        title = firstUserMessage.content.substring(0, 30);
      } else if (Array.isArray(firstUserMessage?.content)) {
        const textPart = firstUserMessage.content.find((p: any) => p.type === 'text');
        title = textPart?.text?.substring(0, 30) || '多模态对话';
      }

      const [newChat] = await db.insert(chats).values({
        userId: session.user.id,
        title: title || '新对话',
      }).returning();
      
      currentChatId = newChat.id;
    }

    // 保存当前用户的最后一条消息
    if (currentChatId && lastMessage && lastMessage.role === 'user') {
      const dbContent = typeof lastMessage.content === 'string' 
        ? lastMessage.content 
        : (lastMessage.content ? JSON.stringify(lastMessage.content) : "");

      await db.insert(chatMessages).values({
        chatId: currentChatId,
        role: 'user',
        content: dbContent || "",
      });

      // 更新会话最后活跃时间
      await db.update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, currentChatId));
    }

    const result = streamText({
      model: defaultModel,
      messages: modelMessages,
      system: '你是一个专业的 AI 助手。' + 
              (isOnline ? ' 你当前拥有联网搜索能力。当用户询问需要实时信息的问题时，你**必须**优先调用 search 工具。' + 
              '在回答结束时，请务必列出你参考的资料数量，并以 Markdown 列表形式提供所有参考资料的跳转链接。' : '当前为离线模式。'),
      tools: isOnline ? {
        search: tool({
          description: '从互联网获取实时信息、新闻或背景资料。',
          inputSchema: z.object({
            query: z.string().describe('搜索关键词'),
          }),
          execute: async ({ query }: { query: string }) => {
            const apiKey = process.env.TAVILY_API_KEY;
            if (!apiKey) return { error: 'TAVILY_API_KEY is not configured' };

            try {
              const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  api_key: apiKey,
                  query,
                  search_depth: "basic",
                  include_answer: true,
                  max_results: 5,
                }),
              });
              
              const data = await response.json();
              if (data.results && Array.isArray(data.results)) {
                return data.results.map((res: any, index: number) => 
                  `[来源 ${index + 1}]\n标题: ${res.title}\n链接: ${res.url}\n摘要: ${res.content}`
                ).join('\n\n');
              }
              return JSON.stringify(data);
            } catch (err) {
              return '搜索失败，请尝试其他关键词。';
            }
          },
        }),
      } : {},
      stopWhen: isOnline ? stepCountIs(5) : stepCountIs(1),
      onFinish: async ({ text }) => {
        // AI 回答完成后，保存到数据库
        if (currentChatId) {
          await db.insert(chatMessages).values({
            chatId: currentChatId,
            role: 'assistant',
            content: text || "",
          });
        }
      }
    });

    // 将 chatId 返回给前端以便后续同步
    return result.toUIMessageStreamResponse({
      headers: currentChatId ? { 'X-Chat-Id': currentChatId } : undefined,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
