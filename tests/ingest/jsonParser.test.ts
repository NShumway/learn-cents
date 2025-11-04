/**
 * Tests for JSON Parser
 */

import { describe, it, expect } from 'vitest';
import { parseJSON } from '../../src/ingest/jsonParser';
import { PlaidUserData, SyntheticDataset } from '../../src/types/plaid';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('JSON Parser', () => {
  it('should parse single user format', async () => {
    const testData: PlaidUserData = {
      metadata: {
        fetched_at: '2025-11-04T00:00:00.000Z',
        environment: 'test',
      },
      accounts: [
        {
          account_id: 'acc_1',
          type: 'depository',
          subtype: 'checking',
          name: 'Checking',
          mask: '1234',
          balances: {
            available: 1000,
            current: 1000,
            limit: null,
            iso_currency_code: 'USD',
          },
        },
      ],
      transactions: [],
      liabilities: [],
      summary: {
        total_accounts: 1,
        total_transactions: 0,
      },
    };

    const filePath = path.join(__dirname, 'test-single-user.json');
    await fs.writeFile(filePath, JSON.stringify(testData));

    const result = await parseJSON(filePath);

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].account_id).toBe('acc_1');
    expect(result.transactions).toHaveLength(0);
    expect(result.liabilities).toHaveLength(0);

    await fs.unlink(filePath);
  });

  it('should parse multi-user dataset format and use first user', async () => {
    const testData: SyntheticDataset = {
      users: [
        {
          user_id: 'user_1',
          name: { first: 'John', last: 'Doe' },
          accounts: [
            {
              account_id: 'acc_1',
              type: 'depository',
              subtype: 'savings',
              name: 'Savings',
              mask: '5678',
              balances: {
                available: 5000,
                current: 5000,
                limit: null,
                iso_currency_code: 'USD',
              },
            },
          ],
          transactions: [],
          liabilities: [],
        },
        {
          user_id: 'user_2',
          name: { first: 'Jane', last: 'Smith' },
          accounts: [],
          transactions: [],
          liabilities: [],
        },
      ],
      generated_at: '2025-11-04T00:00:00.000Z',
      count: 2,
    };

    const filePath = path.join(__dirname, 'test-multi-user.json');
    await fs.writeFile(filePath, JSON.stringify(testData));

    const result = await parseJSON(filePath);

    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].account_id).toBe('acc_1');

    await fs.unlink(filePath);
  });

  it('should throw error for empty multi-user dataset', async () => {
    const testData: SyntheticDataset = {
      users: [],
      generated_at: '2025-11-04T00:00:00.000Z',
      count: 0,
    };

    const filePath = path.join(__dirname, 'test-empty-dataset.json');
    await fs.writeFile(filePath, JSON.stringify(testData));

    await expect(parseJSON(filePath)).rejects.toThrow('No users found in dataset');

    await fs.unlink(filePath);
  });
});
