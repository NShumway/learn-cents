import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { aiModel } from './_lib/ai/client.js';
import { buildSystemPrompt } from './_lib/ai/prompts.js';
import { validateUserMessage, validateResponse } from './_lib/ai/guardrails.js';
import { buildAIContext, sanitizeContext } from './_lib/ai/context.js';
import { getUserFromRequest } from './_lib/supabase.js';
import { prisma } from './_lib/prisma.js';
import { checkRateLimit, RateLimitPresets } from './_lib/rateLimit.js';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, assessmentId }: { messages: UIMessage[]; assessmentId: string } = req.body;

    // 1. Authenticate user
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Rate limiting
    const rateLimit = checkRateLimit(userId, RateLimitPresets.AI_CHAT);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      });
    }

    // 3. Verify consent
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentStatus: true },
    });

    if (!dbUser?.consentStatus) {
      return res.status(403).json({ error: 'Consent required' });
    }

    // 4. Load assessment (verify ownership)
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId,
        isArchived: false,
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // 5. Validate user's latest message
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage?.role === 'user') {
      const validation = validateUserMessage(
        latestUserMessage.parts.find((p) => p.type === 'text')?.text || ''
      );

      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid message',
          details: validation.issues,
        });
      }
    }

    // 6. Build AI context from assessment
    const context = buildAIContext(assessment);
    const sanitizedContext = sanitizeContext(context);
    const systemPrompt = buildSystemPrompt(sanitizedContext);

    // 7. Stream AI response
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // 8. Validate final response
        const validation = validateResponse(text);

        if (!validation.isValid) {
          // Log to admin for review
          await prisma.chatMessage.create({
            data: {
              userId,
              assessmentId,
              role: 'assistant',
              content: text,
              flagged: true,
              flagReason: `Auto-flagged: ${validation.issues.join(', ')}`,
            },
          });
        } else {
          // 9. Save validated messages to database
          const finalText = validation.modifiedContent || text;

          // Save user message
          if (latestUserMessage?.role === 'user') {
            await prisma.chatMessage.create({
              data: {
                userId,
                assessmentId,
                role: 'user',
                content: latestUserMessage.parts.find((p) => p.type === 'text')?.text || '',
              },
            });
          }

          // Save assistant message
          await prisma.chatMessage.create({
            data: {
              userId,
              assessmentId,
              role: 'assistant',
              content: finalText,
            },
          });
        }
      },
    });

    // Stream the text directly
    const stream = result.textStream;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const textPart of stream) {
      res.write(textPart);
    }

    res.end();
  } catch (error) {
    // Log error for debugging (structured logging for production monitoring)
    console.error('Chat API error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check if it's an API key error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isApiKeyError =
      errorMessage.includes('API key') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('401') ||
      errorMessage.includes('Invalid API');

    if (isApiKeyError) {
      return res.status(503).json({
        error: 'AI service configuration error',
        message: 'The AI service is not properly configured. Please contact support.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again.',
    });
  }
}
