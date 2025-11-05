/**
 * Signal Detection Orchestrator
 *
 * Runs all signal detectors and returns comprehensive results
 */

import { UserFinancialData } from '../types/plaid';
import { DetectedSignals } from '../types/signals';
import { detectSubscriptions } from './subscriptionDetector';
import { detectSavings } from './savingsDetector';
import { detectCredit } from './creditDetector';
import { detectIncome } from './incomeDetector';
import { detectOverdrafts } from './overdraftDetector';
import { detectBankingActivity } from './bankingActivityDetector';

export function detectAllSignals(data: UserFinancialData): DetectedSignals {
  const { accounts, transactions, liabilities, recurring_streams } = data;

  return {
    subscriptions: {
      '30d': detectSubscriptions(transactions, '30d', recurring_streams),
      '180d': detectSubscriptions(transactions, '180d', recurring_streams),
    },
    savings: {
      '30d': detectSavings(accounts, transactions, '30d'),
      '180d': detectSavings(accounts, transactions, '180d'),
    },
    credit: {
      '30d': detectCredit(accounts, liabilities, '30d'),
      '180d': detectCredit(accounts, liabilities, '180d'),
    },
    income: {
      '30d': detectIncome(accounts, transactions, '30d'),
      '180d': detectIncome(accounts, transactions, '180d'),
    },
    overdrafts: {
      '30d': detectOverdrafts(accounts, transactions, '30d'),
      '180d': detectOverdrafts(accounts, transactions, '180d'),
    },
    bankingActivity: {
      '30d': detectBankingActivity(transactions, '30d'),
      '180d': detectBankingActivity(transactions, '180d'),
    },
  };
}

export * from './subscriptionDetector';
export * from './savingsDetector';
export * from './creditDetector';
export * from './incomeDetector';
export * from './overdraftDetector';
export * from './bankingActivityDetector';
