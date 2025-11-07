import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { aiModel } from '../_lib/ai/client.js';
import { buildSystemPrompt } from '../_lib/ai/prompts.js';
import { validateUserMessage, validateResponse } from '../_lib/ai/guardrails.js';
import { buildAIContext, sanitizeContext } from '../_lib/ai/context.js';
import { getUserFromRequest } from '../_lib/supabase.js';
import { prisma } from '../_lib/prisma.js';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, assessmentId }: { messages: UIMessage[]; assessmentId: string } =
      await req.json();

    // 1. Authenticate user
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Verify consent
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentStatus: true },
    });

    if (!dbUser?.consentStatus) {
      return new Response(JSON.stringify({ error: 'Consent required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Validate user's latest message
    const latestUserMessage = messages[messages.length - 1];
    if (latestUserMessage?.role === 'user') {
      const validation = validateUserMessage(
        latestUserMessage.parts.find((p) => p.type === 'text')?.text || ''
      );

      if (!validation.isValid) {
        return new Response(
          JSON.stringify({
            error: 'Invalid message',
            details: validation.issues,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 5. Build AI context from assessment
    const context = buildAIContext(assessment);
    const sanitizedContext = sanitizeContext(context);
    const systemPrompt = buildSystemPrompt(sanitizedContext);

    // 6. Stream AI response
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // 7. Validate final response
        const validation = validateResponse(text);

        if (!validation.isValid) {
          console.error('Guardrail violation:', validation.issues);
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

    return result.toUIMessageStreamResponse();
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
      return new Response(
        JSON.stringify({
          error: 'AI service configuration error',
          message: 'The AI service is not properly configured. Please contact support.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
