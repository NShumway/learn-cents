/**
 * Transaction Utilities for Signal Detection
 */

import { PlaidTransaction } from '../../types/plaid';

export function normalizeMerchant(name: string): string {
  return name.toLowerCase().trim();
}

export function isAmountConsistent(
  amount: number,
  median: number,
  tolerance = 0.15
): boolean {
  const diff = Math.abs(amount - median) / median;
  return diff <= tolerance;
}

export function groupByMerchant(
  transactions: PlaidTransaction[]
): Map<string, PlaidTransaction[]> {
  const groups = new Map<string, PlaidTransaction[]>();

  for (const tx of transactions) {
    const merchant = tx.merchant_name || tx.name;
    const normalized = normalizeMerchant(merchant);

    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(tx);
  }

  return groups;
}

export function isIncomeTransaction(tx: PlaidTransaction): boolean {
  return tx.personal_finance_category?.primary === 'INCOME';
}

export function isPayrollTransaction(tx: PlaidTransaction): boolean {
  return tx.personal_finance_category?.detailed === 'INCOME_PAYROLL';
}

export function isOverdraftFee(tx: PlaidTransaction): boolean {
  const name = tx.name.toUpperCase();
  return (
    name.includes('OVERDRAFT') ||
    name.includes('NSF') ||
    name.includes('INSUFFICIENT FUNDS')
  );
}
