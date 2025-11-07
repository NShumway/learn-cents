import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/supabase.js';
import { prisma } from '../_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[ADMIN CHAT] Handler started');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId as string;

    console.log('[ADMIN CHAT] userId:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Authenticate admin
    console.log('[ADMIN CHAT] Authenticating admin...');
    const adminId = await getUserFromRequest(req);
    console.log('[ADMIN CHAT] Admin ID:', adminId);

    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin status
    console.log('[ADMIN CHAT] Checking admin status...');
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { isAdmin: true },
    });
    console.log('[ADMIN CHAT] Admin check result:', admin);

    if (!admin?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch all chat messages for user (masked)
    console.log('[ADMIN CHAT] Fetching messages for userId:', userId);
    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assessmentId: true,
        role: true,
        content: true,
        flagged: true,
        flagReason: true,
        createdAt: true,
      },
      take: 100, // Limit for performance
    });
    console.log('[ADMIN CHAT] Found messages:', messages.length);
    console.log('[ADMIN CHAT] Returning response');

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Admin chat history error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      error: 'Internal server error',
      details: errorMessage,
    });
  }
}
