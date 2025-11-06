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

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        consentStatus: true,
        consentDate: new Date(),
      },
      select: {
        consentStatus: true,
        consentDate: true,
      },
    });

    return res.status(200).json({
      message: 'Consent granted successfully',
      consentStatus: user.consentStatus,
      consentDate: user.consentDate,
    });
  } catch (error) {
    console.error('Grant consent error:', error);
    return res.status(500).json({ error: 'Failed to grant consent' });
  }
}
