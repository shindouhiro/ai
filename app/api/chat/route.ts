import { streamText } from 'ai';
import { customOpenAI } from '@/lib/ai-provider';

/**
 * 核心聊天 API 端点
 * 使用封装好的自定义提供者
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 强力清洗历史记录：只保留 role 和 content，并强制 content 为字符串
    const modelMessages = messages.map((m: any) => {
      let processedContent = '';
      
      // 如果存在 parts 数组，提取所有 text 零件的内容并合并
      if (Array.isArray(m.parts)) {
        processedContent = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text || '')
          .join('\n');
      } else {
        processedContent = m.content || '';
      }

      // 仅返回 ModelMessage 架构白名单中的两个核心字段
      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: processedContent.trim(),
      };
    }).filter((m: any) => m.content); // 过滤掉无效消息

    const result = streamText({
      model: customOpenAI('gpt-5.4'),
      messages: modelMessages,
      system: '你是一个专业的 AI 辅助，能够用流畅且有逻辑的方式回答用户的请求。你支持 Markdown 格式输出。',
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
