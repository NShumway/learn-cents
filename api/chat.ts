import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { aiModel } from './_lib/ai/client.js';
import { buildSystemPrompt } from './_lib/ai/prompts.js';
import { validateUserMessage, validateResponse } from './_lib/ai/guardrails.js';
import { buildAIContext, sanitizeContext } from './_lib/ai/context.js';
import { getUserFromRequest } from './_lib/supabase.js';
import { prisma } from './_lib/prisma.js';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[CHAT] Request received:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, assessmentId }: { messages: UIMessage[]; assessmentId: string } = req.body;
    console.log('[CHAT] Message count:', messages.length, 'Assessment ID:', assessmentId);

    // 1. Authenticate user
    const userId = await getUserFromRequest(req);

    if (!userId) {
      console.log('[CHAT] Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CHAT] User authenticated:', userId);

    // 2. Verify consent
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentStatus: true },
    });

    if (!dbUser?.consentStatus) {
      console.log('[CHAT] User consent not granted');
      return res.status(403).json({ error: 'Consent required' });
    }

    // 3. Load assessment (verify ownership)
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        userId,
        isArchived: false,
      },
    });

    if (!assessment) {
      console.log('[CHAT] Assessment not found:', assessmentId);
      return res.status(404).json({ error: 'Assessment not found' });
    }

    console.log('[CHAT] Assessment loaded successfully');

    // 4. Validate user's latest message
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

    // 5. Build AI context from assessment
    console.log('[CHAT] Building AI context...');
    const context = buildAIContext(assessment);
    const sanitizedContext = sanitizeContext(context);
    const systemPrompt = buildSystemPrompt(sanitizedContext);

    // 6. Stream AI response
    console.log('[CHAT] Starting AI stream...');
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      onFinish: async ({ text }) => {
        console.log('[CHAT] Stream finished, text length:', text.length);

        // 7. Validate final response
        const validation = validateResponse(text);

        if (!validation.isValid) {
          console.error('[CHAT] Guardrail violation:', validation.issues);
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
          // 8. Save validated messages to database
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

    console.log('[CHAT] Streaming response to client...');
    let chunkCount = 0;
    for await (const textPart of stream) {
      chunkCount++;
      res.write(textPart);
    }

    console.log('[CHAT] Stream complete, sent', chunkCount, 'chunks');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);

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
