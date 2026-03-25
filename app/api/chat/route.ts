import { convertToModelMessages, streamText } from 'ai';
import { customOpenAI } from '@/lib/ai-provider';

/**
 * 核心聊天 API 端点
 * 使用封装好的自定义提供者
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: customOpenAI('gpt-5.4'),
      messages: await convertToModelMessages(messages),
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
