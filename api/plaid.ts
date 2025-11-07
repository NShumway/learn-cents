/**
 * POST /api/plaid?action=create-link-token - Create Plaid Link token
 * POST /api/plaid?action=exchange-token - Exchange public token for access token and fetch data
 *
 * Consolidated Plaid API handler
 * Vercel serverless function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  DepositoryAccountSubtype,
  CreditAccountSubtype,
} from 'plaid';

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

  const action = req.query.action as string;

  try {
    // POST /api/plaid?action=create-link-token
    if (action === 'create-link-token') {
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: 'learning-cents-demo-user' },
        client_name: 'Learning Cents',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
        account_filters: {
          depository: {
            account_subtypes: [DepositoryAccountSubtype.Checking, DepositoryAccountSubtype.Savings],
          },
          credit: {
            account_subtypes: [CreditAccountSubtype.CreditCard],
          },
        },
      });

      return res.status(200).json({ link_token: response.data.link_token });
    }

    // POST /api/plaid?action=exchange-token
    if (action === 'exchange-token') {
      const { public_token } = req.body;

      if (!public_token) {
        return res.status(400).json({ error: 'public_token required' });
      }

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
      return res.status(200).json({
        accounts: accountsResponse.data.accounts,
        transactions: transactionsResponse.data.transactions,
        liabilities,
      });
    }

    return res
      .status(400)
      .json({ error: 'Invalid action. Use create-link-token or exchange-token' });
  } catch (error) {
    console.error('Plaid handler error:', error);
    return res.status(500).json({ error: 'Failed to process Plaid request' });
  }
}
