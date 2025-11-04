/**
 * Credit Signal Detection
 *
 * Detects credit card utilization, payment behavior, and debt indicators
 */

import { PlaidAccount, PlaidLiability } from '../types/plaid';
import { CreditSignal, TimeWindow } from '../types/signals';

export function detectCredit(
  accounts: PlaidAccount[],
  liabilities: PlaidLiability[],
  window: TimeWindow
): CreditSignal {
  // Filter credit accounts
  const creditAccounts = accounts.filter((acc) => acc.type === 'credit');

  if (creditAccounts.length === 0) {
    return {
      detected: false,
      evidence: {
        accounts: [],
        maxUtilization: 0,
        avgUtilization: 0,
      },
      window,
    };
  }

  const accountData: CreditSignal['evidence']['accounts'] = [];
  const utilizations: number[] = [];

  for (const account of creditAccounts) {
    const balance = account.balances.current;
    const limit = account.balances.limit || 0;

    // Calculate utilization
    const utilization = limit > 0 ? (balance / limit) * 100 : 0;
    utilizations.push(utilization);

    // Find matching liability data
    const liability = liabilities.find((l) => l.account_id === account.account_id);

    // Check for minimum payment only
    const minimumPaymentOnly =
      liability &&
      liability.last_payment_amount !== undefined &&
      liability.minimum_payment_amount !== undefined
        ? Math.abs(liability.last_payment_amount - liability.minimum_payment_amount) < 1
        : false;

    // Check for interest charges (APR indicates interest-bearing)
    const hasInterestCharges = liability && liability.aprs && liability.aprs.length > 0
      ? liability.aprs[0].apr_percentage > 0
      : false;

    const isOverdue = liability?.is_overdue || false;

    accountData.push({
      accountId: account.account_id,
      mask: account.mask,
      utilization,
      balance,
      limit,
      minimumPaymentOnly,
      hasInterestCharges,
      isOverdue,
    });
  }

  const maxUtilization = Math.max(...utilizations, 0);
  const avgUtilization =
    utilizations.length > 0
      ? utilizations.reduce((sum, u) => sum + u, 0) / utilizations.length
      : 0;

  // Detected if: utilization >= 50% OR interest charges OR minimum payment only OR overdue
  const detected = accountData.some(
    (acc) =>
      acc.utilization >= 50 ||
      acc.hasInterestCharges ||
      acc.minimumPaymentOnly ||
      acc.isOverdue
  );

  return {
    detected,
    evidence: {
      accounts: accountData,
      maxUtilization,
      avgUtilization,
    },
    window,
  };
}
