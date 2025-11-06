import type { PlaidAccount, PlaidTransaction } from '../types/plaidData.js';
import { randomId } from '../utils/faker.js';
import { randomDateBetween } from '../utils/dateUtils.js';

const MERCHANTS = [
  'Amazon',
  'Walmart',
  'Target',
  'Starbucks',
  'McDonalds',
  'Shell Gas Station',
  'CVS Pharmacy',
  'Whole Foods',
  'Netflix',
  'Spotify',
  'Uber',
  'Lyft',
  'AT&T',
  'Verizon',
  'Electric Company',
  'Water Utility',
  'Rent Payment',
  'Mortgage Payment',
  'Car Insurance',
  'Health Insurance',
];

const CATEGORIES = [
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_RESTAURANTS' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_GROCERIES' },
  { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES' },
  { primary: 'GENERAL_MERCHANDISE', detailed: 'GENERAL_MERCHANDISE_SUPERSTORES' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_GAS' },
  { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_TAXIS_AND_RIDE_SHARES' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_MUSIC_AND_AUDIO' },
  { primary: 'ENTERTAINMENT', detailed: 'ENTERTAINMENT_VIDEO' },
  { primary: 'GENERAL_SERVICES', detailed: 'GENERAL_SERVICES_TELECOMMUNICATIONS' },
  { primary: 'HOME_IMPROVEMENT', detailed: 'HOME_IMPROVEMENT_RENT' },
  { primary: 'LOAN_PAYMENTS', detailed: 'LOAN_PAYMENTS_MORTGAGE_PAYMENT' },
  { primary: 'BANK_FEES', detailed: 'BANK_FEES_OVERDRAFT' },
  { primary: 'INCOME', detailed: 'INCOME_WAGES' },
];

export function generateTransactions(
  accounts: PlaidAccount[],
  count: number,
  daysBack: number
): PlaidTransaction[] {
  const transactions: PlaidTransaction[] = [];

  // Find depository accounts for deposits
  const depositoryAccounts = accounts.filter((a) => a.type === 'depository');
  const primaryAccount = depositoryAccounts[0] || accounts[0];

  for (let i = 0; i < count; i++) {
    const isDeposit = Math.random() < 0.15; // 15% are deposits (income)
    const account = isDeposit
      ? primaryAccount
      : accounts[Math.floor(Math.random() * accounts.length)];

    transactions.push(generateTransaction(account, daysBack, isDeposit));
  }

  // Sort by date descending (most recent first)
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return transactions;
}

function generateTransaction(
  account: PlaidAccount,
  daysBack: number,
  isDeposit: boolean
): PlaidTransaction {
  const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
  const category = isDeposit
    ? CATEGORIES.find((c) => c.primary === 'INCOME')!
    : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length - 1)]; // Exclude income

  // Amount varies based on category
  let amount: number;
  if (isDeposit) {
    amount = -(Math.random() * 3000 + 1500); // $1500 - $4500 deposits (negative in Plaid)
  } else if (category?.primary === 'HOME_IMPROVEMENT' && category?.detailed.includes('RENT')) {
    amount = Math.random() * 1000 + 1200; // $1200 - $2200 rent
  } else if (category?.primary === 'LOAN_PAYMENTS') {
    amount = Math.random() * 1000 + 1000; // $1000 - $2000 loan payments
  } else if (category?.primary === 'TRANSPORTATION' && category?.detailed.includes('GAS')) {
    amount = Math.random() * 60 + 30; // $30 - $90 gas
  } else if (category?.primary === 'FOOD_AND_DRINK' && category?.detailed.includes('COFFEE')) {
    amount = Math.random() * 5 + 3; // $3 - $8 coffee
  } else {
    amount = Math.random() * 150 + 10; // $10 - $160 general
  }

  return {
    transaction_id: randomId('txn'),
    account_id: account.account_id,
    date: randomDateBetween(daysBack),
    amount: Math.round(amount * 100) / 100, // Round to 2 decimals
    merchant_name: isDeposit ? 'Employer Inc' : merchant,
    merchant_entity_id: randomId('merchant'),
    payment_channel: Math.random() < 0.6 ? 'online' : 'in store',
    personal_finance_category: category || CATEGORIES[0],
    pending: Math.random() < 0.05, // 5% pending
    name: isDeposit ? 'Payroll Deposit' : `${merchant} Purchase`,
  };
}
