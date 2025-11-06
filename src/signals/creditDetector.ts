/**
 * Credit Signal Detection
 *
 * Detects credit card utilization, payment behavior, and debt indicators
 */

import { PlaidAccount, PlaidLiability } from '../types/plaid';
import { CreditSignal, TimeWindow, UtilizationBucket } from '../types/signals';

function getUtilizationBucket(utilization: number): UtilizationBucket {
  if (utilization < 30) return 'under_30';
  if (utilization < 50) return '30_to_50';
  if (utilization < 80) return '50_to_80';
  return 'over_80';
}

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
        overallUtilization: {
          percent: 0,
          bucket: 'under_30',
        },
      },
      window,
    };
  }

  const accountData: CreditSignal['evidence']['accounts'] = [];
  let totalBalance = 0;
  let totalLimit = 0;

  for (const account of creditAccounts) {
    const balance = account.balances.current;
    const limit = account.balances.limit || 0;

    // Calculate utilization
    const utilizationPercent = limit > 0 ? (balance / limit) * 100 : 0;
    const utilizationBucket = getUtilizationBucket(utilizationPercent);

    // Track for overall calculation
    totalBalance += balance;
    totalLimit += limit;

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
    const hasInterestCharges =
      liability && liability.aprs && liability.aprs.length > 0
        ? liability.aprs[0].apr_percentage > 0
        : false;

    const isOverdue = liability?.is_overdue || false;

    accountData.push({
      accountId: account.account_id,
      mask: account.mask,
      utilizationBucket,
      utilizationPercent,
      balance,
      limit,
      minimumPaymentOnly,
      hasInterestCharges,
      isOverdue,
    });
  }

  // Calculate overall utilization (sum of balances / sum of limits)
  const overallUtilizationPercent = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  const overallUtilizationBucket = getUtilizationBucket(overallUtilizationPercent);

  // Detected if: any account utilization >= 50% OR interest charges OR minimum payment only OR overdue
  const detected = accountData.some(
    (acc) =>
      acc.utilizationBucket === '50_to_80' ||
      acc.utilizationBucket === 'over_80' ||
      acc.hasInterestCharges ||
      acc.minimumPaymentOnly ||
      acc.isOverdue
  );

  return {
    detected,
    evidence: {
      accounts: accountData,
      overallUtilization: {
        percent: overallUtilizationPercent,
        bucket: overallUtilizationBucket,
      },
    },
    window,
  };
}
