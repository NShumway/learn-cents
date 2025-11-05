/**
 * Plaid Link Integration
 *
 * SANDBOX MODE for Phase 3 - production setup in Phase 4
 * Server-side token exchange and data fetching implemented in Phase 4
 */

import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';
import type { UserFinancialData } from '../../src/types/plaid';

/**
 * Plaid Link hook for OAuth account connection
 * SANDBOX MODE - production setup in Phase 4
 */
export function usePlaidConnection(linkToken: string, onSuccess: PlaidLinkOnSuccess) {
  const { open, ready, error } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return { open, ready, error };
}

/**
 * Exchange public token for access token
 * STUB - will be implemented server-side in Phase 4
 *
 * Phase 4 implementation:
 * POST /api/plaid/exchange_token
 * Server exchanges public token for access token with Plaid
 */
export async function exchangePublicToken(publicToken: string): Promise<string> {
  console.log('[STUB] Public token received:', publicToken);
  console.log('[STUB] In Phase 4, this will call POST /api/plaid/exchange_token');

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));

  return 'mock-access-token-sandbox';
}

/**
 * Fetch transactions and account data from Plaid
 * STUB - will be implemented server-side in Phase 4
 *
 * Phase 4 implementation:
 * POST /api/plaid/fetch_data
 * Server fetches data from Plaid and returns to client
 */
export async function fetchPlaidData(accessToken: string): Promise<UserFinancialData> {
  console.log('[STUB] Fetching data with access token:', accessToken);
  console.log('[STUB] In Phase 4, this will call POST /api/plaid/fetch_data');

  throw new Error(
    'fetchPlaidData not yet implemented. ' +
    'For now, use the mock assessment data. ' +
    'Server-side Plaid integration happens in Phase 4.'
  );
}
