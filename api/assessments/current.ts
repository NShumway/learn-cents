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

    // Get current (non-archived) assessment
    const assessment = await prisma.assessment.findFirst({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'No current assessment found' });
    }

    return res.status(200).json({ assessment });
  } catch (error) {
    console.error('Get current assessment error:', error);
    return res.status(500).json({ error: 'Failed to get current assessment' });
  }
}
