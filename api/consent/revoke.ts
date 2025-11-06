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

    await prisma.user.update({
      where: { id: userId },
      data: {
        consentStatus: false,
        consentDate: null,
      },
    });

    return res.status(200).json({
      message: 'Consent revoked successfully',
      prompt: 'Would you also like to delete your data?',
    });
  } catch (error) {
    console.error('Revoke consent error:', error);
    return res.status(500).json({ error: 'Failed to revoke consent' });
  }
}
