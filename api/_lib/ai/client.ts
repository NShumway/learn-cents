import { openai } from '@ai-sdk/openai';

// Validate API key configuration
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'sk_nicetry' || !apiKey.startsWith('sk-')) {
  console.error('⚠️  WARNING: OpenAI API key is not properly configured!');
  console.error('Please set a valid OPENAI_API_KEY in your .env file');
}

export const aiModel = openai('gpt-4o-mini');

export const AI_CONFIG = {
  temperature: 0.7, // Balanced creativity for educational content
  maxTokens: 1000, // Reasonable limit per response
  topP: 1,
  model: 'gpt-4o-mini',
} as const;
