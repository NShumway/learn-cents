import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../../../lib/supabase';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

    const assessmentId = req.query.id as string;
    const { reason } = req.body;

    const assessment = await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        isFlagged: true,
        flaggedAt: new Date(),
        flaggedBy: userId,
        flagReason: reason || null,
      },
    });

    return res.status(200).json({
      message: 'Assessment flagged successfully',
      assessment,
    });
  } catch (error) {
    console.error('Flag assessment error:', error);
    return res.status(500).json({ error: 'Failed to flag assessment' });
  }
}
