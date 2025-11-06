import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../lib/supabase';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromRequest(req as unknown as Request);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin (only admins can view archived assessments)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get target user ID from query params (for admins viewing other users)
    const targetUserId = (req.query.userId as string) || userId;

    // Get archived assessments
    const assessments = await prisma.assessment.findMany({
      where: {
        userId: targetUserId,
        isArchived: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ assessments });
  } catch (error) {
    console.error('Get archived assessments error:', error);
    return res.status(500).json({ error: 'Failed to get archived assessments' });
  }
}
