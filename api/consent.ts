import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './_lib/supabase.js';
import { prisma } from './_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET - Check consent status
    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          consentStatus: true,
          consentDate: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        hasConsent: user.consentStatus,
        consentStatus: user.consentStatus,
        consentDate: user.consentDate,
      });
    }

    // POST - Grant consent
    if (req.method === 'POST') {
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
    }

    // DELETE - Revoke consent
    if (req.method === 'DELETE') {
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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Consent handler error:', error);
    return res.status(500).json({ error: 'Failed to process consent request' });
  }
}
