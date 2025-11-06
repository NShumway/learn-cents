import type { PlaidAccount, PlaidLiability } from '../types/plaidData.js';

export function generateLiabilities(accounts: PlaidAccount[], count: number): PlaidLiability[] {
  const liabilities: PlaidLiability[] = [];

  // Find credit card accounts
  const creditAccounts = accounts.filter((a) => a.type === 'credit');

  for (let i = 0; i < count && i < creditAccounts.length; i++) {
    liabilities.push(generateCreditCardLiability(creditAccounts[i]));
  }

  return liabilities;
}

function generateCreditCardLiability(account: PlaidAccount): PlaidLiability {
  const currentBalance = account.balances.current;
  const minimumPayment = Math.max(25, currentBalance * 0.02); // 2% or $25, whichever is greater

  return {
    account_id: account.account_id,
    type: 'credit',
    aprs: [
      {
        apr_type: 'purchase_apr',
        apr_percentage: Math.random() * 15 + 12, // 12% - 27% APR
      },
    ],
    minimum_payment_amount: Math.round(minimumPayment * 100) / 100,
    last_payment_amount: Math.random() < 0.8 ? minimumPayment * (Math.random() + 1) : 0,
    is_overdue: Math.random() < 0.1, // 10% overdue
    next_payment_due_date: getNextPaymentDate(),
    last_statement_balance: currentBalance * (Math.random() * 0.2 + 0.9), // 90-110% of current
  };
}

function getNextPaymentDate(): string {
  const date = new Date();
  // Next payment is typically 15-25 days from now
  date.setDate(date.getDate() + Math.floor(Math.random() * 10) + 15);
  return date.toISOString().split('T')[0];
}

// TODO: Implement student loan and mortgage liabilities
