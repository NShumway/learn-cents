import { openai } from '@ai-sdk/openai';

export const aiModel = openai('gpt-4o-mini');

export const AI_CONFIG = {
  temperature: 0.7, // Balanced creativity for educational content
  maxTokens: 1000, // Reasonable limit per response
  topP: 1,
  model: 'gpt-4o-mini',
} as const;
