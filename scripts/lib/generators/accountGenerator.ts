import type { PlaidAccount } from '../types/plaidData.js';
import { randomId } from '../utils/faker.js';

export function generateAccounts(_userId: string, count: number): PlaidAccount[] {
  const accounts: PlaidAccount[] = [];

  // Ensure at least one checking account
  accounts.push(generateCheckingAccount());

  // Add additional random accounts
  for (let i = 1; i < count; i++) {
    const rand = Math.random();
    if (rand < 0.3) {
      accounts.push(generateSavingsAccount());
    } else if (rand < 0.6) {
      accounts.push(generateCreditCard());
    } else {
      accounts.push(generateCheckingAccount());
    }
  }

  return accounts;
}

function generateCheckingAccount(): PlaidAccount {
  const balance = Math.random() * 5000 + 500; // $500 - $5500

  return {
    account_id: randomId('acc'),
    type: 'depository',
    subtype: 'checking',
    balances: {
      available: balance,
      current: balance,
      limit: null,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Checking Account',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

function generateSavingsAccount(): PlaidAccount {
  const balance = Math.random() * 10000 + 1000; // $1000 - $11000

  return {
    account_id: randomId('acc'),
    type: 'depository',
    subtype: 'savings',
    balances: {
      available: balance,
      current: balance,
      limit: null,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Savings Account',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

function generateCreditCard(): PlaidAccount {
  const limit = Math.random() * 20000 + 1000; // $1000 - $21000 limit
  const utilization = Math.random(); // 0-100% utilization
  const balance = limit * utilization;

  return {
    account_id: randomId('acc'),
    type: 'credit',
    subtype: 'credit card',
    balances: {
      available: limit - balance,
      current: balance,
      limit: limit,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Credit Card',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

// TODO: Implement other account types (money market, HSA, etc.)
