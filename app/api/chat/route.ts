import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';

/**
 * 核心聊天 API 端点
 * 支持工具调用，可根据需要扩展（如联网搜索）
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- Incoming Request Body ---');
    console.log(JSON.stringify(body, null, 2));
    console.log('-----------------------------');

    const { messages, metadata: rootMetadata } = body;
    // 关键修复：从最后一条消息或根目录提取 metadata
    const lastMessage = messages?.[messages.length - 1];
    const metadata = lastMessage?.metadata || rootMetadata;

    const isOnline = metadata?.isOnline ?? false;
    const isDeepThinking = metadata?.isDeepThinking ?? false;

    // AI SDK 6.0 中 convertToModelMessages 是异步的
    const modelMessages = await convertToModelMessages(messages);

    // 调试日志：检查环境变量和 metadata
    console.log('Online Mode:', isOnline, 'API Key Length:', process.env.OPENAI_API_KEY?.length);

    const result = streamText({
      // 固定使用默认模型（gpt-5.4 + .chat()），避免前端选择不支持的模型名
      model: defaultModel,
      messages: modelMessages,
      system: '你是一个专业的 AI 助手。' + 
              (isOnline ? ' 你当前拥有联网搜索能力。当用户询问需要实时信息的问题时，你**必须**优先调用 search 工具。' + 
              '在回答结束时，请务必列出你参考的资料数量，并以 Markdown 列表形式提供所有参考资料的跳转链接。' : '当前为离线模式。'),
      tools: isOnline ? {
        search: tool({
          description: '从互联网获取实时信息、新闻或背景资料。',
          // AI SDK 6.0 使用 inputSchema 代替 parameters
          inputSchema: z.object({
            query: z.string().describe('搜索关键词'),
          }),
          execute: async ({ query }: { query: string }) => {
            console.log('Searching for:', query);
            const apiKey = process.env.TAVILY_API_KEY;
            
            if (!apiKey) {
              return { error: 'TAVILY_API_KEY is not configured' };
            }

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
                const resultsStr = data.results.map((res: any, index: number) => 
                  `[来源 ${index + 1}]\n标题: ${res.title}\n链接: ${res.url}\n摘要: ${res.content}`
                ).join('\n\n');
                
                return `已找到 ${data.results.length} 篇相关资料，请务必在回答中引用并列出链接：\n\n${resultsStr}`;
              }
              return JSON.stringify(data);
            } catch (err) {
              console.error('Search tool error:', err);
              return '搜索失败，请尝试其他关键词。';
            }
          },
        }),
      } : {},
      // AI SDK 6.0 使用 stopWhen 代替 maxSteps
      stopWhen: isOnline ? stepCountIs(5) : stepCountIs(1),
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
