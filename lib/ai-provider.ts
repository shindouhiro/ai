import { createOpenAI } from '@ai-sdk/openai';

/**
 * 封装 Vercel AI SDK 的 OpenAI 兼容提供者
 * 使用用户提供的 Base URL 和 API Key
 */
export const customOpenAI = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://proxy.i2c.de5.net/v1',
  apiKey: process.env.OPENAI_API_KEY || 'sk-egwLiCNg73LnhoBcA',
});

// 默认模型配置
// AI SDK 6.0 默认向 /responses 发送请求，这里强制使用 .chat() 以兼容旧代理的 /chat/completions
export const defaultModel = customOpenAI.chat('gpt-5.4');
