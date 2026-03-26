import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { customOpenAI, defaultModel } from '@/lib/ai-provider';
import { z } from 'zod';

/**
 * 核心聊天 API 端点
 * 支持工具调用，可根据需要扩展（如联网搜索）
 */
export async function POST(req: Request) {
  try {
    const { messages, metadata } = await req.json();
    const isOnline = metadata?.isOnline ?? false;
    const modelName = metadata?.model;

    // AI SDK 6.0 中 convertToModelMessages 是异步的
    const modelMessages = await convertToModelMessages(messages);

    // 调试日志：检查环境变量加载情况
    console.log('API Key loaded:', !!process.env.OPENAI_API_KEY, 'Length:', process.env.OPENAI_API_KEY?.length);

    const result = streamText({
      // 固定使用默认模型（gpt-5.4 + .chat()），避免前端选择不支持的模型名
      model: defaultModel,
      messages: modelMessages,
      system: '你是一个专业的 AI 助手，能够用流畅且有逻辑的方式回答用户的请求。你支持 Markdown 格式输出。' + 
              (isOnline ? ' 当用户请求需要实时信息时，请使用 search 工具进行联网查询。' : ''),
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
              return data;
            } catch (err) {
              console.error('Search tool error:', err);
              return { error: 'Search failed' };
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
