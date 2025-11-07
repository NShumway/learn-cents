import { getUserFromRequest } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const assessmentId = url.searchParams.get('assessmentId');

    if (!assessmentId) {
      return new Response(JSON.stringify({ error: 'Assessment ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate user
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch chat history (verify ownership via assessment)
    const messages = await prisma.chatMessage.findMany({
      where: {
        assessmentId,
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        flagged: true,
      },
    });

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat history error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
