import { createOpenAI } from '@ai-sdk/openai';

/**
 * 封装 Vercel AI SDK 的 OpenAI 兼容提供者
 * 使用用户提供的 Base URL 和 API Key
 */
export const customOpenAI = createOpenAI({
  baseURL: 'https://proxy.i2c.de5.net/v1',
  apiKey: 'sk-egwLiCNg73LnhoBcA',
});

// 默认模型配置
export const defaultModel = customOpenAI('gpt-5.4');
