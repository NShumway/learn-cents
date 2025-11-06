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
 * Fetch link token from server
 * This is called when the page loads to initialize Plaid Link
 */
export async function fetchLinkToken(): Promise<string> {
  try {
    const response = await fetch('/api/plaid/create-link-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: 'demo-user' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch link token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.link_token;
  } catch (error) {
    console.error('Error fetching link token:', error);
    throw error;
  }
}

/**
 * Exchange public token and fetch financial data
 * This combines token exchange and data fetching in one API call
 */
export async function exchangeTokenAndFetchData(publicToken: string): Promise<UserFinancialData> {
  try {
    const response = await fetch('/api/plaid/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_token: publicToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange token and fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return data as UserFinancialData;
  } catch (error) {
    console.error('Error exchanging token and fetching data:', error);
    throw error;
  }
}

/**
 * Connect to Plaid Sandbox directly (bypasses Plaid Link UI)
 * This creates a sandbox item and fetches financial data in one call
 */
export async function connectSandboxAccount(): Promise<UserFinancialData> {
  try {
    const response = await fetch('/api/plaid/sandbox_connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to connect sandbox account: ${response.statusText}`);
    }

    const data = await response.json();
    return data as UserFinancialData;
  } catch (error) {
    console.error('Error connecting sandbox account:', error);
    throw error;
  }
}
