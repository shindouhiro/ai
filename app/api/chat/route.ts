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
      .map((p: any) => p.text)
      .join('');
  }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text ||'').join('');
  }
  // 如果是多模态且有附件，我们可以选择串行化整个 content 数组
  return message.content ? JSON.stringify(message.content) : "";
}

/**
 * 核心聊天 API 端点
 * 已集成历史记录自动保存
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { messages, metadata: rootMetadata, chatId: providedChatId } = body;

    // 关键：从最后一条消息或根目录提取 metadata
    const lastMessage = messages?.[messages.length - 1];
    const metadata = lastMessage?.metadata || rootMetadata;

    const isOnline = metadata?.isOnline ?? false;
    
    // AI SDK 核心处理
    const modelMessages = await convertToModelMessages(messages);

    let currentChatId = providedChatId;

    // 1. 自动创建会话 (如果需要)
    if (!currentChatId && session?.user?.id && messages.length > 0) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user');
      const textContent = extractMessageContent(firstUserMessage);
      const title = textContent.substring(0, 30) || '新对话';

      const [newChat] = await db.insert(chats).values({
        userId: session.user.id,
        title: title,
      }).returning();
      
      currentChatId = newChat.id;
    }

    // 2. 只有在 chatId 存在时才保存用户消息
    if (currentChatId && lastMessage && lastMessage.role === 'user') {
      // 这里的 content 可能包含文本和多模态零件，我们直接存储其序列化结果
      // 这样前端加载历史时可以解析回 parts
      const contentToSave = typeof lastMessage.content === 'string' && lastMessage.content !== ""
        ? lastMessage.content 
        : (lastMessage.content && lastMessage.content.length > 0 ? JSON.stringify(lastMessage.content) : "");

      // 关键补丁：如果 content 确实是空的（例如多模态消息通过 parts 传输），则尝试从 parts 提取
      let finalContent = contentToSave;
      if (!finalContent && lastMessage.parts) {
        finalContent = JSON.stringify(lastMessage.parts);
      }

      await db.insert(chatMessages).values({
        chatId: currentChatId,
        role: 'user',
        content: finalContent || "",
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
              (isOnline ? ' 你当前拥有联网搜索能力。当用户询问需要实时信息的问题时，你**必须**优先调用 search 工具。' : '当前为离线模式。'),
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
                body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 5 }),
              });
              const data = await response.json();
              if (data.results && Array.isArray(data.results)) {
                return data.results.map((res: any, index: number) => 
                  `[来源 ${index + 1}]\n标题: ${res.title}\n链接: ${res.url}\n摘要: ${res.content}`
                ).join('\n\n');
              }
              return JSON.stringify(data);
            } catch (err) {
              return '搜索失败。';
            }
          },
        }),
      } : {},
      stopWhen: isOnline ? stepCountIs(5) : stepCountIs(1),
      onFinish: async ({ text }) => {
        if (currentChatId) {
          await db.insert(chatMessages).values({
            chatId: currentChatId,
            role: 'assistant',
            content: text || "",
          });
        }
      }
    });

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
