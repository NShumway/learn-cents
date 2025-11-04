import { generateAccounts } from './accountGenerator.js';
import { generateTransactions } from './transactionGenerator.js';
import { generateLiabilities } from './liabilityGenerator.js';
import { randomId, randomName } from '../utils/faker.js';
import type { PlaidUser } from '../types/plaidData.js';

export function generateSyntheticUsers(count: number): PlaidUser[] {
  const users: PlaidUser[] = [];

  for (let i = 0; i < count; i++) {
    const userId = randomId('user');
    const name = randomName();

    // Generate 1-5 accounts per user
    const accounts = generateAccounts(userId, Math.floor(Math.random() * 5) + 1);

    // Generate 100-2000 transactions per user (spread over 180 days)
    const transactionCount = Math.floor(Math.random() * 1900) + 100;
    const transactions = generateTransactions(accounts, transactionCount, 180);

    // Generate 0-3 liabilities (not all users have debt)
    const liabilityCount = Math.random() > 0.3 ? Math.floor(Math.random() * 3) : 0;
    const liabilities = generateLiabilities(accounts, liabilityCount);

    users.push({
      user_id: userId,
      name,
      accounts,
      transactions,
      liabilities
    });
  }

  return users;
}
