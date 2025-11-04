#!/usr/bin/env tsx

/**
 * Explore Plaid Sandbox Data
 *
 * This CLI tool fetches real data from Plaid's sandbox environment
 * to understand the actual data structures we'll be working with.
 *
 * Usage:
 *   npm run explore:plaid
 */

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

dotenv.config();

// Validate environment variables
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
  console.error('❌ Missing Plaid credentials in .env file');
  console.error('   PLAID_CLIENT_ID and PLAID_SECRET are required');
  process.exit(1);
}

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

async function main() {
  console.log('🔍 Exploring Plaid Sandbox Data\n');
  console.log('Environment:', PLAID_ENV);
  console.log('Client ID:', PLAID_CLIENT_ID?.substring(0, 10) + '...\n');

  try {
    // Step 1: Create a Link Token
    console.log('Step 1: Creating Link Token...');
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: 'test-user-' + Date.now(),
      },
      client_name: 'Learn Cents Sandbox Explorer',
      products: [Products.Transactions, Products.Liabilities, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    console.log('✓ Link Token created:', linkTokenResponse.data.link_token.substring(0, 20) + '...\n');

    // Step 2: For sandbox, we can directly exchange a public token
    // Use special test credentials that have transaction history
    console.log('Step 2: Creating Sandbox Public Token with transaction history...');
    const sandboxTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // First Platypus Bank (Chase sandbox)
      initial_products: [Products.Transactions, Products.Liabilities, Products.Auth],
      options: {
        webhook: 'https://example.com/webhook', // Required for immediate transaction availability
      },
    });

    const publicToken = sandboxTokenResponse.data.public_token;
    console.log('✓ Public Token created:', publicToken.substring(0, 20) + '...\n');

    // Step 3: Exchange public token for access token
    console.log('Step 3: Exchanging for Access Token...');
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    console.log('✓ Access Token obtained:', accessToken.substring(0, 20) + '...\n');

    // Step 3.5: Fire webhook to trigger transaction sync in sandbox
    console.log('Step 3.5: Triggering transaction sync...');
    try {
      await plaidClient.sandboxItemFireWebhook({
        access_token: accessToken,
        webhook_code: 'DEFAULT_UPDATE',
      });
      console.log('✓ Transaction sync triggered, waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✓ Ready to fetch data\n');
    } catch (error: any) {
      console.log('⚠️  Could not trigger webhook (continuing anyway)\n');
    }

    // Step 4: Fetch Accounts
    console.log('Step 4: Fetching Accounts...');
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    console.log(`✓ Found ${accounts.length} accounts:\n`);

    for (const account of accounts) {
      console.log(`  Account: ${account.name}`);
      console.log(`    Type: ${account.type} - ${account.subtype}`);
      console.log(`    Mask: ****${account.mask}`);
      console.log(`    Balance: $${account.balances.current?.toFixed(2) || 0}`);
      if (account.balances.limit) {
        console.log(`    Limit: $${account.balances.limit.toFixed(2)}`);
      }
      console.log('');
    }

    // Step 5: Fetch Transactions using transactionsSync (recommended method)
    console.log('Step 5: Fetching Transactions using sync...');
    let cursor: string | undefined = undefined;
    let transactions: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const syncResponse = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
      });

      const data = syncResponse.data;
      transactions = transactions.concat(data.added);

      cursor = data.next_cursor;
      hasMore = data.has_more;

      // In sandbox, if we get an empty cursor, wait and retry
      if (cursor === '' && hasMore) {
        console.log('  Waiting for more transactions...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✓ Found ${transactions.length} transactions\n`);

    // Show a few sample transactions
    console.log('Sample Transactions (first 5):');
    for (const tx of transactions.slice(0, 5)) {
      console.log(`  ${tx.date} - ${tx.name}`);
      console.log(`    Amount: $${tx.amount.toFixed(2)}`);
      console.log(`    Merchant: ${tx.merchant_name || 'N/A'}`);
      console.log(`    Category: ${tx.personal_finance_category?.primary || 'N/A'} > ${tx.personal_finance_category?.detailed || 'N/A'}`);
      console.log('');
    }

    // Step 6: Fetch Liabilities
    console.log('Step 6: Fetching Liabilities...');
    try {
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      });

      const creditCards = liabilitiesResponse.data.liabilities.credit || [];
      const studentLoans = liabilitiesResponse.data.liabilities.student || [];
      const mortgages = liabilitiesResponse.data.liabilities.mortgage || [];

      console.log(`✓ Found ${creditCards.length} credit cards, ${studentLoans.length} student loans, ${mortgages.length} mortgages\n`);

      if (creditCards.length > 0) {
        console.log('Credit Card Details:');
        for (const card of creditCards) {
          console.log(`  Account ending in ${card.account_id}`);
          console.log(`    APR: ${card.aprs?.[0]?.apr_percentage || 'N/A'}%`);
          console.log(`    Minimum Payment: $${card.minimum_payment_amount?.toFixed(2) || 'N/A'}`);
          console.log(`    Is Overdue: ${card.is_overdue || false}`);
          console.log('');
        }
      }
    } catch (error: any) {
      console.log('⚠️  Liabilities data not available in sandbox (this is expected)');
    }

    // Step 7: Save data to file for analysis
    console.log('\nStep 7: Saving data to file...');
    const now = new Date();
    const outputData = {
      metadata: {
        fetched_at: now.toISOString(),
        environment: PLAID_ENV,
        institution: 'First Platypus Bank (Sandbox)',
        note: transactions.length === 0 ? 'No transactions available - this is common in fresh sandbox accounts' : undefined,
      },
      accounts: accounts.map(acc => ({
        account_id: acc.account_id,
        type: acc.type,
        subtype: acc.subtype,
        name: acc.name,
        mask: acc.mask,
        balances: {
          available: acc.balances.available,
          current: acc.balances.current,
          limit: acc.balances.limit,
          iso_currency_code: acc.balances.iso_currency_code,
        },
      })),
      transactions: transactions.map(tx => ({
        transaction_id: tx.transaction_id,
        account_id: tx.account_id,
        date: tx.date,
        amount: tx.amount,
        merchant_name: tx.merchant_name,
        merchant_entity_id: tx.merchant_entity_id,
        payment_channel: tx.payment_channel,
        personal_finance_category: tx.personal_finance_category,
        pending: tx.pending,
        name: tx.name,
      })),
      summary: {
        total_accounts: accounts.length,
        total_transactions: transactions.length,
      },
    };

    const outputPath = './data/plaid-sandbox-sample.json';
    await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✓ Data saved to ${outputPath}\n`);

    // Step 8: Display analysis
    console.log('📊 Data Structure Analysis:\n');
    console.log('Accounts Structure:');
    console.log('  - account_id: string');
    console.log('  - type: string (depository, credit, loan)');
    console.log('  - subtype: string (checking, savings, credit card, etc.)');
    console.log('  - balances.current: number');
    console.log('  - balances.limit: number | null');
    console.log('');
    console.log('Transactions Structure:');
    console.log('  - transaction_id: string');
    console.log('  - date: string (YYYY-MM-DD)');
    console.log('  - amount: number (positive = debit, negative = credit)');
    console.log('  - merchant_name: string | null');
    console.log('  - personal_finance_category: { primary, detailed }');
    console.log('  - name: string (transaction description)');
    console.log('');

    // Display category distribution
    const categoryCount = new Map<string, number>();
    for (const tx of transactions) {
      const category = tx.personal_finance_category?.primary || 'UNCATEGORIZED';
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }

    console.log('Transaction Categories Found:');
    for (const [category, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${category}: ${count} transactions`);
    }

    console.log('\n✅ Exploration complete!');
    console.log(`\nNext steps:`);
    console.log(`  1. Review the saved data in ${outputPath}`);
    console.log(`  2. Understand the structure for JSON/CSV conversion`);
    console.log(`  3. Plan signal detection algorithms based on this data`);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main().catch(console.error);
