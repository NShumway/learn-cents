/**
 * JSON Parser for Plaid Data
 *
 * Handles both single-user and multi-user dataset formats
 */

import * as fs from 'fs/promises';
import { PlaidUserData, SyntheticDataset, UserFinancialData } from '../types/plaid';

export async function parseJSON(filePath: string): Promise<UserFinancialData> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Handle multi-user dataset format (synthetic data)
  if (data.users && Array.isArray(data.users)) {
    const dataset = data as SyntheticDataset;
    if (dataset.users.length === 0) {
      throw new Error('No users found in dataset');
    }
    const user = dataset.users[0]; // Use first user
    return {
      accounts: user.accounts || [],
      transactions: user.transactions || [],
      liabilities: user.liabilities || [],
    };
  }

  // Handle single user format (Plaid API response)
  const userData = data as PlaidUserData;
  return {
    accounts: userData.accounts || [],
    transactions: userData.transactions || [],
    liabilities: userData.liabilities || [],
  };
}
