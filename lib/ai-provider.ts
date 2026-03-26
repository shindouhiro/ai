import { createOpenAI } from '@ai-sdk/openai';

/**
 * 封装 Vercel AI SDK 的 OpenAI 兼容提供者
 * 使用用户提供的 Base URL 和 API Key
 */
export const customOpenAI = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.zyai.online/v1',
  apiKey: process.env.OPENAI_API_KEY || 'sk-2fmJFAh9ZCJY7NIi2e573aF450Ec49AbA36c5c2d3bFaC73a',
  fetch: async (url, options) => {
    // 调试日志：查看发送到代理的完整请求
    if (options?.body) {
      const body = JSON.parse(options.body as string);
      console.log('--- API Request Payload ---');
      console.log('URL:', url);
      console.log('Model:', body.model);
      console.log('Tools provided:', !!body.tools, body.tools?.length || 0);
      console.log('---------------------------');
    }
    return fetch(url, options);
  }
});

// 默认模型配置
// AI SDK 6.0 默认向 /responses 发送请求，这里强制使用 .chat() 以兼容旧代理的 /chat/completions
export const defaultModel = customOpenAI.chat('gpt-5.4');
