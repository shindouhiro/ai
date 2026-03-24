import { streamText } from 'ai';
import { customOpenAI } from '@/lib/ai-provider';

/**
 * 核心聊天 API 端点
 * 使用封装好的自定义提供者
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // AI SDK 6.x 要求使用 ModelMessage 格式（带有 content 且不允许 id）
    // 而前端发来的 UIMessage 通常带有 id，且可能是 parts 格式
    const modelMessages = messages.map((m: any) => {
      // 移除 id
      const { id, parts, content, ...rest } = m;
      return {
        ...rest,
        // 如果有 parts 则作为 content，否则使用原有的 content
        content: parts || content || '',
      };
    });

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
