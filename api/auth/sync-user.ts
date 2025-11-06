import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return res.status(200).json({ message: 'User already exists' });
    }

    // Create user in database
    await prisma.user.create({
      data: {
        id: userId,
        email,
        consentStatus: false, // Consent will be requested after signup
      },
    });

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Sync user error:', error);
    return res.status(500).json({ error: 'Failed to sync user' });
  }
}
