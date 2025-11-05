/**
 * Learn Cents API Server
 *
 * Simple Express server for Plaid integration (Sandbox mode)
 * Provides endpoints for:
 * - Creating Plaid Link tokens
 * - Exchanging public tokens and fetching account/transaction data
 */

import express from 'express';
import cors from 'cors';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Plaid client
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

/**
 * POST /api/plaid/create_link_token
 *
 * Creates a Plaid Link token for initializing Plaid Link
 */
app.post('/api/plaid/create_link_token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: 'learning-cents-demo-user',
      },
      client_name: 'Learning Cents',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    res.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to create link token',
      details: error.response?.data || error.message,
    });
  }
});

/**
 * POST /api/plaid/exchange_and_fetch
 *
 * Exchanges public token for access token and fetches account/transaction data
 * Returns data in the format expected by the assessment engine
 */
app.post('/api/plaid/exchange_and_fetch', async (req, res) => {
  try {
    const { public_token } = req.body;

    if (!public_token) {
      return res.status(400).json({ error: 'public_token is required' });
    }

    // Step 1: Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;

    // Step 2: Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Step 3: Fetch transactions (last 180 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    // Step 4: Fetch liabilities (credit card info)
    let liabilities: any[] = [];
    try {
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      });
      liabilities = liabilitiesResponse.data.liabilities?.credit || [];
    } catch (error) {
      // Liabilities might not be available for all accounts
      console.warn('Could not fetch liabilities:', error);
    }

    // Step 5: Format data for assessment engine
    const financialData = {
      accounts: accountsResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
      liabilities: liabilities,
    };

    res.json(financialData);
  } catch (error: any) {
    console.error('Error exchanging token and fetching data:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to exchange token and fetch data',
      details: error.response?.data || error.message,
    });
  }
});

/**
 * POST /api/plaid/sandbox_connect
 *
 * Directly creates a sandbox item and fetches data (bypasses Plaid Link UI)
 * This simulates a user connecting their bank account in sandbox mode
 */
app.post('/api/plaid/sandbox_connect', async (req, res) => {
  try {
    // Step 1: Create a sandbox public token directly (no UI needed)
    const sandboxTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // First Platypus Bank (Chase sandbox)
      initial_products: [Products.Transactions],
      options: {
        webhook: 'https://example.com/webhook',
        override_username: 'user_transactions_dynamic', // User with 50 transactions (pending + posted)
      },
    });

    const publicToken = sandboxTokenResponse.data.public_token;
    console.log('✓ Sandbox public token created');

    // Step 2: Exchange for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    console.log('✓ Access token obtained');

    // Step 2.5: Call transactions/refresh to populate transaction data (required for sandbox)
    try {
      await plaidClient.transactionsRefresh({
        access_token: accessToken,
      });
      console.log('✓ Transactions refresh triggered, waiting for data to populate...');
      // Wait for transactions to be generated
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.warn('Could not refresh transactions:', error.response?.data?.error_message || error.message);
    }

    // Step 3: Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Step 4: Fetch transactions using transactionsSync (recommended method)
    // Try multiple times since sandbox can be slow to populate
    let transactions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && transactions.length === 0) {
      let cursor: string | undefined = undefined;
      let hasMore = true;
      transactions = [];

      while (hasMore) {
        const syncResponse = await plaidClient.transactionsSync({
          access_token: accessToken,
          cursor: cursor,
        });

        const data = syncResponse.data;
        transactions = transactions.concat(data.added);

        cursor = data.next_cursor;
        hasMore = data.has_more;

        // In sandbox, if we get an empty cursor and still have more, wait and retry
        if (cursor === '' && hasMore) {
          console.log('  Waiting for more transactions...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      attempts++;
      if (transactions.length === 0 && attempts < maxAttempts) {
        console.log(`  No transactions yet, retrying (${attempts}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✓ Fetched ${accountsResponse.data.accounts.length} accounts and ${transactions.length} transactions`);

    // Step 5: Fetch liabilities (credit card info)
    let liabilities: any[] = [];
    try {
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      });
      liabilities = liabilitiesResponse.data.liabilities?.credit || [];
    } catch (error) {
      console.warn('Could not fetch liabilities (expected in sandbox)');
    }

    // Step 6: Format data for assessment engine
    const financialData = {
      accounts: accountsResponse.data.accounts,
      transactions: transactions,
      liabilities: liabilities,
    };

    res.json(financialData);
  } catch (error: any) {
    console.error('Error in sandbox connect:', error.response?.data || error);
    res.status(500).json({
      error: 'Failed to connect sandbox account',
      details: error.response?.data || error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'learning-cents-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Learning Cents API server running on port ${PORT}`);
  console.log(`📊 Plaid environment: ${process.env.PLAID_ENV || 'sandbox'}`);
});
