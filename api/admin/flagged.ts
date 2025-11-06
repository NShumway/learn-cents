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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all flagged assessments
    const flaggedAssessments = await prisma.assessment.findMany({
      where: {
        isFlagged: true,
      },
      include: {
        user: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        flaggedAt: 'desc',
      },
    });

    return res.status(200).json({ flaggedAssessments });
  } catch (error) {
    console.error('Get flagged assessments error:', error);
    return res.status(500).json({ error: 'Failed to get flagged assessments' });
  }
}
