import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './lib/supabase.js';
import { prisma } from './lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST /api/assessments - Create new assessment
    if (req.method === 'POST') {
      // Check consent
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { consentStatus: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.consentStatus) {
        return res
          .status(403)
          .json({ error: 'Consent required. Please grant consent to store assessments.' });
      }

      const { priorityInsight, additionalInsights, signals, decisionTree } = req.body;

      if (!priorityInsight || !additionalInsights || !signals || !decisionTree) {
        return res.status(400).json({ error: 'Missing required assessment data' });
      }

      // Archive previous assessments
      await prisma.assessment.updateMany({
        where: {
          userId,
          isArchived: false,
        },
        data: {
          isArchived: true,
        },
      });

      // Create new assessment
      const assessment = await prisma.assessment.create({
        data: {
          userId,
          priorityInsight,
          additionalInsights,
          signals,
          decisionTree,
          isArchived: false,
        },
      });

      return res.status(201).json({
        message: 'Assessment stored successfully',
        assessmentId: assessment.id,
      });
    }

    // GET /api/assessments?type=current - Get current assessment
    // GET /api/assessments?type=archived - Get archived assessments (admin only)
    if (req.method === 'GET') {
      const type = req.query.type as string;
      const targetUserId = (req.query.userId as string) || userId;

      if (type === 'archived') {
        // Check if user is admin (only admins can view archived assessments)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }

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
      }

      // Default: get current (non-archived) assessment
      const assessment = await prisma.assessment.findFirst({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ assessment: assessment || null });
    }

    // PATCH /api/assessments?id=<assessment_id> - Flag/unflag assessment (admin only)
    if (req.method === 'PATCH') {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const assessmentId = req.query.id as string;
      const { isFlagged, flagReason } = req.body;

      if (!assessmentId) {
        return res.status(400).json({ error: 'Assessment ID required' });
      }

      if (typeof isFlagged !== 'boolean') {
        return res.status(400).json({ error: 'isFlagged must be a boolean' });
      }

      const assessment = await prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          isFlagged,
          flaggedAt: isFlagged ? new Date() : null,
          flaggedBy: isFlagged ? userId : null,
          flagReason: isFlagged ? flagReason || null : null,
        },
      });

      return res.status(200).json({
        message: isFlagged
          ? 'Assessment flagged successfully'
          : 'Assessment unflagged successfully',
        assessment,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Assessments handler error:', error);
    return res.status(500).json({ error: 'Failed to process assessment request' });
  }
}
