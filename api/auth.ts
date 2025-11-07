import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest, supabaseAdmin } from './_lib/supabase.js';
import { prisma } from './_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // POST /api/auth?action=signup - Atomic signup (Supabase + Database)
    if (req.method === 'POST' && req.query.action === 'signup') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create auth user' });
      }

      try {
        // Step 2: Create user in our database
        await prisma.user.create({
          data: {
            id: authData.user.id,
            email: authData.user.email!,
            consentStatus: false,
          },
        });

        return res.status(201).json({
          message: 'User created successfully',
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
        });
      } catch (dbError) {
        // Rollback: Delete from Supabase Auth if database creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.error('Database creation failed, rolled back auth user:', dbError);
        return res.status(500).json({ error: 'Failed to create user. Please try again.' });
      }
    }

    // POST /api/auth?action=sync - Sync user from Supabase to database (legacy, kept for compatibility)
    if (req.method === 'POST' && req.query.action === 'sync') {
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
    }

    // All other methods require authentication
    const userId = await getUserFromRequest(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // GET /api/auth - Get current session
    if (req.method === 'GET') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          consentStatus: true,
          consentDate: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ user });
    }

    // DELETE /api/auth - Delete account and all data
    if (req.method === 'DELETE') {
      // Delete user from database (CASCADE will handle related data)
      // This deletes:
      // - User record
      // - All assessments (current + archived)
      // - All chat messages
      await prisma.user.delete({
        where: { id: userId },
      });

      // Delete user from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Supabase auth deletion error:', authError);
        // User is already deleted from database, so we continue
      }

      return res.status(200).json({
        message: 'Account and all data deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth handler error:', error);
    return res.status(500).json({ error: 'Failed to process auth request' });
  }
}
