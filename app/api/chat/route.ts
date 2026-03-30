import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { chatMessages, chats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 助手：提取消息内容的字符串表示 (增加鲁棒性)
 */
function extractMessageContent(message: any): string {
  if (!message) return "";
  
  if (typeof message.content === 'string' && message.content) {
    return message.content;
  }
  
  const contentArray = message.content || message.parts;
  if (Array.isArray(contentArray)) {
    return contentArray
      .filter((p: any) => p && (p.type === 'text' || p.text))
      .map((p: any) => p.text || "")
      .join('');
  }
  
  return message.content ? JSON.stringify(message.content) : "";
}

/**
 * 助手：对消息进行标准化处理 (超强鲁棒性)
 * 适配 AI SDK v6，防止 convertToModelMessages 因 parts 为空或格式不对而崩溃
 */
function normalizeMessages(messages: any[]): any[] {
  if (!Array.isArray(messages)) return [];
  
  return messages.filter(Boolean).map(m => {
    const role = m.role || 'user';
    let content = m.content;

    // 如果 content 是数组，强制转为字符串，因为这是最稳健的格式
    if (Array.isArray(content)) {
       content = content
         .map((p: any) => (typeof p === 'string' ? p : (p?.text || '')))
         .join('');
    }

    // 构造一个最干净的消息对象，剔除所有可能让 SDK 崩溃的 undefined map 属性
    const cleanMessage: any = {
      role,
      content: String(content || ""),
    };

    // 如果有有效的附件，才保留
    if (Array.isArray(m.experimental_attachments)) {
      cleanMessage.experimental_attachments = m.experimental_attachments;
    }

    return cleanMessage;
  });
}

/**
 * 核心聊天 API 端点
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    
    // 调试日志：看清前端到底传了什么
    console.log('[Chat API] Received Body:', JSON.stringify(body, null, 2));

    const { messages, metadata: rootMetadata, chatId: providedChatId } = body;

    // 基础校验
    if (!messages || !Array.isArray(messages)) {
       return new Response(JSON.stringify({ error: "Messages is required and must be an array" }), { status: 400 });
    }

    // 提取元数据
    const lastMessage = messages[messages.length - 1];
    const metadata = lastMessage?.metadata || rootMetadata;
    const isOnline = metadata?.isOnline ?? false;
    
    // 规整消息
    const normalizedMessages = normalizeMessages(messages);
    
    // 关键改变：手动转换消息格式，跳过脆弱的 convertToModelMessages
    const modelMessages: any[] = normalizedMessages.map(m => {
      if (Array.isArray(m.experimental_attachments) && m.experimental_attachments.length > 0) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content || "" },
            ...m.experimental_attachments.map((a: any) => ({
              type: 'image',
              image: a.url,
            }))
          ]
        };
      }
      return { 
        role: m.role, 
        content: m.content || "" 
      };
    });

    let currentChatId = providedChatId;

    // 1. 自动创建会话 (如果需要)
    if (!currentChatId && session?.user?.id && normalizedMessages.length > 0) {
      const firstUserMessage = normalizedMessages.find((m: any) => m.role === 'user');
      const textContent = extractMessageContent(firstUserMessage || normalizedMessages[0]);
      const title = textContent.substring(0, 30) || '新对话';
      
      try {
        const [newChat] = await db.insert(chats).values({ 
          userId: session.user.id, 
          title 
        }).returning();
        currentChatId = newChat.id;
      } catch (dbErr) {
        console.error('[DB Error] Create Chat Failed:', dbErr);
      }
    }

    // 2. 保存用户最后一条消息 (保持数据库内容为字符串)
    if (currentChatId && lastMessage && lastMessage.role === 'user') {
      const contentToSave = extractMessageContent(lastMessage);
      try {
        await db.insert(chatMessages).values({ 
          chatId: currentChatId, 
          role: 'user', 
          content: contentToSave || "" 
        });
        await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, currentChatId));
      } catch (dbErr) {
        console.error('[DB Error] Save User Message Failed:', dbErr);
      }
    }

    // 3. 流式生成
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
      stopWhen: isOnline ? stepCountIs(10) : stepCountIs(1),
      onFinish: async ({ text }) => {
        if (currentChatId) {
          try {
            await db.insert(chatMessages).values({ 
              chatId: currentChatId, 
              role: 'assistant', 
              content: text || "" 
            });
          } catch (dbErr) {
            console.error('[DB Error] Save Assistant Message Failed:', dbErr);
          }
        }
      }
    });

    // 降级为最原始的“裸流” (toTextStreamResponse)，只传文字，没有任何 JSON 协议包装
    // 这能彻底解决 v2 协议在老旧前端上的解析失败问题
    return result.toTextStreamResponse({
      headers: {
        ...(currentChatId ? { 'X-Chat-Id': currentChatId } : {}),
      },
    });

  } catch (error) {
    console.error('--- Chat API CRITICAL ERROR ---');
    console.error('Message:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    console.error('-------------------------------');
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }), { status: 500 });
  }
}
