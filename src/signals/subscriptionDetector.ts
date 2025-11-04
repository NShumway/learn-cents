/**
 * Subscription Detection
 *
 * Detects recurring subscription payments based on merchant, amount consistency, and cadence
 */

import { PlaidTransaction, PlaidRecurringStream } from '../types/plaid';
import { SubscriptionSignal, TimeWindow } from '../types/signals';
import { getTransactionsInWindow, daysBetween, median } from './utils/dateUtils';
import { groupByMerchant, normalizeMerchant, isAmountConsistent } from './utils/transactionUtils';

interface Cadence {
  type: 'weekly' | 'biweekly' | 'monthly';
  avgDays: number;
  tolerance: number;
}

const CADENCES: Cadence[] = [
  { type: 'weekly', avgDays: 7, tolerance: 2 },
  { type: 'biweekly', avgDays: 14, tolerance: 3 },
  { type: 'monthly', avgDays: 30, tolerance: 5 },
];

function mapPlaidFrequencyToCadence(
  frequency: PlaidRecurringStream['frequency']
): 'weekly' | 'biweekly' | 'monthly' | null {
  switch (frequency) {
    case 'WEEKLY':
      return 'weekly';
    case 'BIWEEKLY':
    case 'SEMI_MONTHLY':
      return 'biweekly';
    case 'MONTHLY':
      return 'monthly';
    default:
      return null; // Don't include ANNUALLY or UNKNOWN
  }
}

export function detectSubscriptions(
  transactions: PlaidTransaction[],
  window: TimeWindow,
  recurringStreams?: PlaidRecurringStream[]
): SubscriptionSignal {
  const days = window === '30d' ? 30 : 180;
  const windowTxs = getTransactionsInWindow(transactions, days);

  // Filter to only debits (positive amounts = money spent)
  const debitTxs = windowTxs.filter((tx) => tx.amount > 0);

  const subscriptions: SubscriptionSignal['evidence']['subscriptions'] = [];
  const detectedStreamIds = new Set<string>();

  // Step 1: Add Plaid-detected recurring streams (if available)
  if (recurringStreams) {
    for (const stream of recurringStreams) {
      // Only include active outflow streams (subscriptions)
      if (!stream.is_active || stream.average_amount.amount <= 0) continue;

      // Check if stream has transactions in our window
      const streamTxsInWindow = stream.transaction_ids.filter((txId) =>
        debitTxs.some((tx) => tx.transaction_id === txId)
      );

      if (streamTxsInWindow.length === 0) continue;

      // Map Plaid frequency to our cadence
      const cadence = mapPlaidFrequencyToCadence(stream.frequency);
      if (!cadence) continue;

      subscriptions.push({
        merchant: stream.merchant_name || stream.description,
        amount: stream.average_amount.amount,
        cadence,
        lastChargeDate: stream.last_date,
        count: stream.transaction_ids.length,
      });

      detectedStreamIds.add(stream.stream_id);
    }
  }

  // Step 2: Run custom detection for subscriptions not caught by Plaid
  const merchantGroups = groupByMerchant(debitTxs);
  const detectedMerchants = new Set(subscriptions.map((s) => normalizeMerchant(s.merchant)));

  for (const [merchant, txs] of merchantGroups) {
    // Skip if already detected by Plaid
    if (detectedMerchants.has(merchant)) continue;

    // Must have at least 3 transactions
    if (txs.length < 3) continue;

    // Sort by date
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate gaps between transactions
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    // Find matching cadence
    const medianGap = median(gaps);
    const matchingCadence = CADENCES.find((cadence) =>
      Math.abs(medianGap - cadence.avgDays) <= cadence.tolerance
    );

    if (!matchingCadence) continue;

    // Check amount consistency
    const amounts = sorted.map((tx) => tx.amount);
    const medianAmount = median(amounts);
    const consistentAmounts = amounts.filter((amt) =>
      isAmountConsistent(amt, medianAmount)
    );

    // Must have at least 3 consistent amounts
    if (consistentAmounts.length < 3) continue;

    // Found a subscription!
    subscriptions.push({
      merchant,
      amount: medianAmount,
      cadence: matchingCadence.type,
      lastChargeDate: sorted[sorted.length - 1].date,
      count: sorted.length,
    });
  }

  // Calculate subscription spending metrics
  const totalMonthlySpend = windowTxs
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const subscriptionSpend = subscriptions.reduce((sum, sub) => {
    const monthlyAmount =
      sub.cadence === 'weekly'
        ? sub.amount * 4
        : sub.cadence === 'biweekly'
        ? sub.amount * 2
        : sub.cadence === 'monthly'
        ? sub.amount
        : sub.amount / 3;
    return sum + monthlyAmount;
  }, 0);

  const subscriptionShareOfSpend =
    totalMonthlySpend > 0 ? (subscriptionSpend / totalMonthlySpend) * 100 : 0;

  return {
    detected: subscriptions.length > 0,
    evidence: {
      subscriptions,
      totalMonthlySpend,
      subscriptionShareOfSpend,
    },
    window,
  };
}
