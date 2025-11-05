/**
 * Date Utilities for Signal Detection
 */

import { PlaidTransaction } from '../../types/plaid';

export function getTransactionsInWindow(
  transactions: PlaidTransaction[],
  days: number,
  endDate: Date = new Date()
): PlaidTransaction[] {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });
}

export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}
