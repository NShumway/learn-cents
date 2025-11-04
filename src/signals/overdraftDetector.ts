/**
 * Overdraft Pattern Detection
 *
 * Detects negative balances and overdraft/NSF fees
 */

import { PlaidAccount, PlaidTransaction } from '../types/plaid';
import { OverdraftSignal, TimeWindow } from '../types/signals';
import { getTransactionsInWindow } from './utils/dateUtils';
import { isOverdraftFee } from './utils/transactionUtils';

export function detectOverdrafts(
  accounts: PlaidAccount[],
  transactions: PlaidTransaction[],
  window: TimeWindow
): OverdraftSignal {
  const txs30d = getTransactionsInWindow(transactions, 30);
  const txs180d = getTransactionsInWindow(transactions, 180);

  const incidents: OverdraftSignal['evidence']['incidents'] = [];

  // Check checking accounts for negative balances
  const checkingAccounts = accounts.filter((acc) => acc.subtype === 'checking');
  for (const account of checkingAccounts) {
    if (account.balances.current < 0 || (account.balances.available && account.balances.available < 0)) {
      incidents.push({
        date: new Date().toISOString().split('T')[0], // Current date
        amount: Math.abs(account.balances.current),
        type: 'negative_balance',
      });
    }
  }

  // Check for overdraft/NSF fees in transactions
  for (const tx of txs180d) {
    if (isOverdraftFee(tx)) {
      const type = tx.name.toUpperCase().includes('NSF')
        ? 'nsf_fee'
        : 'overdraft_fee';

      incidents.push({
        date: tx.date,
        amount: tx.amount,
        type,
      });
    }
  }

  // Sort incidents by date
  incidents.sort((a, b) => a.date.localeCompare(b.date));

  // Count incidents in each window
  const incidents30dDates = new Set(
    txs30d.map((tx) => tx.date)
  );
  const count30d = incidents.filter((inc) => incidents30dDates.has(inc.date)).length;
  const count180d = incidents.length;

  // Calculate total fees
  const totalFees = incidents
    .filter((inc) => inc.type !== 'negative_balance')
    .reduce((sum, inc) => sum + inc.amount, 0);

  // Detected if: ≥1 incident in 30d OR ≥2 incidents in 180d
  const detected = count30d >= 1 || count180d >= 2;

  return {
    detected,
    evidence: {
      incidents,
      count30d,
      count180d,
      totalFees,
    },
    window,
  };
}
