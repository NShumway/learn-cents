import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/supabase.js';
import { prisma } from '../_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // GET /api/admin/flagged - Get all flagged assessments
    if (req.method === 'GET') {
      const flaggedAssessments = await prisma.assessment.findMany({
        where: {
          isFlagged: true,
        },
        select: {
          id: true,
          userId: true,
          createdAt: true,
          flaggedAt: true,
          flagReason: true,
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });

      return res.status(200).json({ flaggedAssessments });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin flagged handler error:', error);
    return res.status(500).json({ error: 'Failed to load flagged assessments' });
  }
}
