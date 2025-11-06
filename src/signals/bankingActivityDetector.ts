/**
 * Banking Activity Detection
 *
 * Detects low-use banking patterns based on outbound payment activity
 */

import { PlaidTransaction } from '../types/plaid';
import { BankingActivitySignal, TimeWindow } from '../types/signals';
import { getTransactionsInWindow } from './utils/dateUtils';

export function detectBankingActivity(
  transactions: PlaidTransaction[],
  window: TimeWindow
): BankingActivitySignal {
  const days = window === '30d' ? 30 : 180;
  const windowTxs = getTransactionsInWindow(transactions, days);

  // Filter to outbound payments only (positive amounts = debits/spending)
  const outboundPayments = windowTxs.filter((tx) => tx.amount > 0);

  // Count unique merchants for outbound payments
  const uniqueMerchants = new Set<string>();
  for (const tx of outboundPayments) {
    const merchant = (tx.merchant_name || tx.name).toLowerCase().trim();
    uniqueMerchants.add(merchant);
  }

  const outboundPaymentCount30d =
    window === '30d'
      ? outboundPayments.length
      : getTransactionsInWindow(transactions, 30).filter((tx) => tx.amount > 0).length;

  const outboundPaymentCount180d = outboundPayments.length;

  // Detected as "Low-Use" if:
  // - < 10 outbound payments in 180d
  // - AND < 5 outbound payments in 30d
  // - AND < 5 unique merchants
  const detected =
    outboundPaymentCount180d < 10 && outboundPaymentCount30d < 5 && uniqueMerchants.size < 5;

  return {
    detected,
    evidence: {
      outboundPaymentCount30d,
      outboundPaymentCount180d,
      uniquePaymentMerchants: uniqueMerchants.size,
    },
    window,
  };
}
