/**
 * Savings Signal Detection
 *
 * Detects positive savings behavior based on balance growth and net inflows
 */

import { PlaidAccount, PlaidTransaction } from '../types/plaid';
import { SavingsSignal, TimeWindow } from '../types/signals';
import { getTransactionsInWindow } from './utils/dateUtils';

const SAVINGS_ACCOUNT_TYPES = ['savings', 'money market', 'hsa'];

export function detectSavings(
  accounts: PlaidAccount[],
  transactions: PlaidTransaction[],
  window: TimeWindow
): SavingsSignal {
  const days = window === '30d' ? 30 : 180;

  // Filter savings accounts
  const savingsAccounts = accounts.filter((acc) =>
    SAVINGS_ACCOUNT_TYPES.includes(acc.subtype)
  );

  if (savingsAccounts.length === 0) {
    return {
      detected: false,
      evidence: {
        accounts: [],
        totalSavings: 0,
        emergencyFundCoverage: 0,
      },
      window,
    };
  }

  const accountData: SavingsSignal['evidence']['accounts'] = [];

  for (const account of savingsAccounts) {
    const accountTxs = getTransactionsInWindow(transactions, days).filter(
      (tx) => tx.account_id === account.account_id
    );

    // Calculate net inflow (credits - debits)
    const netInflow = accountTxs.reduce((sum, tx) => {
      // Negative amount = credit (money in), positive = debit (money out)
      return sum - tx.amount;
    }, 0);

    // For growth rate, we need to estimate start balance
    // endBalance = current balance
    // startBalance = endBalance - netInflow
    const endBalance = account.balances.current;
    const startBalance = endBalance - netInflow;

    const growthRate =
      startBalance > 0 ? ((endBalance - startBalance) / startBalance) * 100 : 0;

    accountData.push({
      accountId: account.account_id,
      type: account.subtype,
      startBalance,
      endBalance,
      growthRate,
      netInflow,
    });
  }

  const totalSavings = savingsAccounts.reduce(
    (sum, acc) => sum + acc.balances.current,
    0
  );

  // Calculate average monthly expenses from spending
  const spendingTxs = getTransactionsInWindow(transactions, days).filter(
    (tx) => tx.amount > 0
  );
  const totalSpending = spendingTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const averageMonthlyExpenses = (totalSpending / days) * 30;

  const emergencyFundCoverage =
    averageMonthlyExpenses > 0 ? totalSavings / averageMonthlyExpenses : 0;

  // Detected if growth rate >= 2% OR net inflow >= $200/month
  const monthlyNetInflow = accountData.reduce(
    (sum, acc) => sum + (acc.netInflow / days) * 30,
    0
  );
  const hasPositiveGrowth = accountData.some((acc) => acc.growthRate >= 2);
  const hasSignificantInflow = monthlyNetInflow >= 200;

  return {
    detected: hasPositiveGrowth || hasSignificantInflow,
    evidence: {
      accounts: accountData,
      totalSavings,
      emergencyFundCoverage,
    },
    window,
  };
}
