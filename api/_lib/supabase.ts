import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function getUserFromRequest(req: VercelRequest | Request): Promise<string | null> {
  // Handle both VercelRequest (object headers) and Request (Headers API)
  let authHeader: string | null = null;

  if ('get' in req.headers && typeof req.headers.get === 'function') {
    // Standard Request object with Headers API
    authHeader = req.headers.get('authorization');
  } else {
    // VercelRequest with plain object headers
    authHeader =
      ((req.headers as Record<string, string | string[] | undefined>)['authorization'] as
        | string
        | undefined) || null;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}
