import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';

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
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!adminUser?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const targetUserId = req.query.id as string;

    // Get user details (masked for privacy)
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        isAdmin: true,
        consentStatus: true,
        consentDate: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current assessment
    const currentAssessment = await prisma.assessment.findFirst({
      where: {
        userId: targetUserId,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get count of archived assessments
    const archivedCount = await prisma.assessment.count({
      where: {
        userId: targetUserId,
        isArchived: true,
      },
    });

    return res.status(200).json({
      user,
      currentAssessment,
      archivedCount,
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ error: 'Failed to get user details' });
  }
}
