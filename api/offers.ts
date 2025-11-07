import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './lib/supabase.js';
import { prisma } from './lib/prisma.js';

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const offerId = req.query.id as string;

    // GET /api/offers?id=<offer_id> - Get specific offer
    if (offerId) {
      const offer = await prisma.partnerOffer.findUnique({
        where: { id: offerId },
      });

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      return res.status(200).json({ offer });
    }

    // GET /api/offers - Get all offers
    const offers = await prisma.partnerOffer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ offers });
  } catch (error) {
    console.error('Offers handler error:', error);
    return res.status(500).json({ error: 'Failed to process offers request' });
  }
}
