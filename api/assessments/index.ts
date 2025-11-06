import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../lib/supabase';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await getUserFromRequest(req as unknown as Request);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    const { priorityInsight, additionalInsights, eligibilityMetrics, decisionTree } = req.body;

    if (!priorityInsight || !additionalInsights || !eligibilityMetrics || !decisionTree) {
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
        eligibilityMetrics,
        decisionTree,
        isArchived: false,
      },
    });

    return res.status(201).json({
      message: 'Assessment stored successfully',
      assessmentId: assessment.id,
    });
  } catch (error) {
    console.error('Store assessment error:', error);
    return res.status(500).json({ error: 'Failed to store assessment' });
  }
}
