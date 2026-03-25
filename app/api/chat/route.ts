import { streamText } from 'ai';
import { customOpenAI } from '@/lib/ai-provider';

/**
 * 核心聊天 API 端点
 * 使用封装好的自定义提供者
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const modelMessages = messages.map((m: any) => {
      const content = Array.isArray(m.parts) 
        ? m.parts.map((p: any) => {
            if (p.type === 'text') {
              return { type: 'text', text: p.text };
            }
            if (p.type === 'file' && p.mediaType?.startsWith('image/')) {
              // Extract base64 if it's a data URL
              const url = p.url as string;
              if (url.startsWith('data:')) {
                const base64 = url.split(',')[1];
                return { type: 'image', image: base64, mimeType: p.mediaType };
              }
              return { type: 'image', image: new URL(url), mimeType: p.mediaType };
            }
            return null;
          }).filter(Boolean)
        : m.content;

      return {
        role: m.role,
        content: content
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
