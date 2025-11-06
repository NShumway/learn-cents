/**
 * Income Stability Detection
 *
 * Detects income payment frequency and consistency
 */

import { PlaidAccount, PlaidTransaction } from '../types/plaid';
import { IncomeSignal, TimeWindow } from '../types/signals';
import { getTransactionsInWindow, daysBetween, median, average } from './utils/dateUtils';
import { isIncomeTransaction } from './utils/transactionUtils';

interface Frequency {
  type: 'weekly' | 'biweekly' | 'monthly';
  avgDays: number;
  tolerance: number;
}

const FREQUENCIES: Frequency[] = [
  { type: 'weekly', avgDays: 7, tolerance: 2 },
  { type: 'biweekly', avgDays: 14, tolerance: 3 },
  { type: 'monthly', avgDays: 30, tolerance: 5 },
];

export function detectIncome(
  accounts: PlaidAccount[],
  transactions: PlaidTransaction[],
  window: TimeWindow
): IncomeSignal {
  const days = window === '30d' ? 30 : 180;
  const windowTxs = getTransactionsInWindow(transactions, days);

  // Filter income transactions (prioritize payroll)
  const incomeTxs = windowTxs
    .filter((tx) => isIncomeTransaction(tx))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (incomeTxs.length === 0) {
    return {
      detected: false,
      evidence: {
        incomeBuckets: [],
        frequency: 'irregular',
        medianPayGap: 0,
        averageIncome: 0,
        cashFlowBuffer: 0,
      },
      window,
    };
  }

  // Calculate gaps between income deposits
  const gaps: number[] = [];
  for (let i = 1; i < incomeTxs.length; i++) {
    gaps.push(daysBetween(incomeTxs[i - 1].date, incomeTxs[i].date));
  }

  const medianPayGap = median(gaps);

  // Determine frequency
  let frequency: IncomeSignal['evidence']['frequency'] = 'irregular';
  const matchingFrequency = FREQUENCIES.find(
    (freq) => Math.abs(medianPayGap - freq.avgDays) <= freq.tolerance
  );

  if (matchingFrequency) {
    frequency = matchingFrequency.type;
  } else if (medianPayGap > 45) {
    frequency = 'irregular';
  }

  // Calculate average income (use negative amounts since income is negative in Plaid)
  const incomeAmounts = incomeTxs.map((tx) => Math.abs(tx.amount));
  const averageIncome = average(incomeAmounts);

  // Calculate cash flow buffer (checking balance / average monthly expenses)
  const checkingAccounts = accounts.filter((acc) => acc.subtype === 'checking');
  const totalChecking = checkingAccounts.reduce((sum, acc) => sum + acc.balances.current, 0);

  // Estimate monthly expenses from spending
  const spendingTxs = windowTxs.filter((tx) => tx.amount > 0);
  const totalSpending = spendingTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const averageMonthlyExpenses = (totalSpending / days) * 30;

  const cashFlowBuffer = averageMonthlyExpenses > 0 ? totalChecking / averageMonthlyExpenses : 0;

  // Detected if median pay gap > 45 days OR frequency is irregular
  const detected = medianPayGap > 45 || frequency === 'irregular';

  // Create 15-day income buckets
  const incomeBuckets = create15DayIncomeBuckets(incomeTxs, days);

  return {
    detected,
    evidence: {
      incomeBuckets,
      frequency,
      medianPayGap,
      averageIncome,
      cashFlowBuffer,
    },
    window,
  };
}

/**
 * Create 15-day income buckets from income transactions
 * Only includes buckets that have income (no zero-income buckets)
 */
function create15DayIncomeBuckets(
  incomeTxs: PlaidTransaction[],
  totalDays: number
): Array<{ startDate: string; endDate: string; totalIncome: number }> {
  if (incomeTxs.length === 0) return [];

  // Get the date range
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays);

  // Create buckets (2 for 30d, 12 for 180d)
  const numBuckets = Math.ceil(totalDays / 15);
  const buckets: Array<{ startDate: string; endDate: string; totalIncome: number }> = [];

  for (let i = 0; i < numBuckets; i++) {
    const bucketStart = new Date(startDate);
    bucketStart.setDate(bucketStart.getDate() + i * 15);

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketEnd.getDate() + 14); // 15 days (0-14)

    // Don't go beyond today
    if (bucketEnd > today) {
      bucketEnd.setTime(today.getTime());
    }

    // Sum income in this bucket
    const bucketIncome = incomeTxs
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= bucketStart && txDate <= bucketEnd;
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Only include buckets with income
    if (bucketIncome > 0) {
      buckets.push({
        startDate: formatDate(bucketStart),
        endDate: formatDate(bucketEnd),
        totalIncome: Math.round(bucketIncome * 100) / 100, // Round to 2 decimals
      });
    }
  }

  return buckets;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
