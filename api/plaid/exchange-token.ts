/**
 * POST /api/plaid/exchange-token
 *
 * Exchanges public token for access token and fetches account/transaction data
 * Vercel serverless function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClient = new PlaidApi(
  new Configuration({
    basePath:
      PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] ||
      PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_token } = req.body;
  if (!public_token) {
    return res.status(400).json({ error: 'public_token required' });
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = exchangeResponse.data.access_token;

    // Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Fetch transactions (last 180 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    // Fetch liabilities (credit card info)
    let liabilities: unknown[] = [];
    try {
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      });
      liabilities = liabilitiesResponse.data.liabilities?.credit || [];
    } catch {
      console.warn('Could not fetch liabilities');
    }

    // Return financial data
    res.status(200).json({
      accounts: accountsResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
      liabilities,
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
}
