import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../../src/lib/supabase.js';
import { prisma } from '../../src/lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromRequest(req);

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
    const flaggedOnly = req.query.flagged === 'true';

    // GET /api/admin/users?id=<user_id> - Get specific user details
    if (targetUserId) {
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
    }

    // GET /api/admin/users?flagged=true - Get users with flagged assessments
    if (flaggedOnly) {
      const flaggedAssessments = await prisma.assessment.findMany({
        where: {
          isFlagged: true,
        },
        include: {
          user: {
            select: {
              id: true,
              createdAt: true,
              consentStatus: true,
              isAdmin: true,
            },
          },
        },
        orderBy: {
          flaggedAt: 'desc',
        },
      });

      return res.status(200).json({ flaggedAssessments });
    }

    // GET /api/admin/users - Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        consentStatus: true,
        isAdmin: true,
        _count: {
          select: {
            assessments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Admin users handler error:', error);
    return res.status(500).json({ error: 'Failed to process admin request' });
  }
}
