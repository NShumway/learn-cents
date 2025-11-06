/**
 * Re-export Plaid types from canonical source
 * All types are defined in src/types/plaid.ts
 */

export type {
  PlaidAccount,
  PlaidTransaction,
  PlaidLiability,
  UserFinancialData,
  SyntheticDataset,
  PlaidRecurringStream,
} from '../../../src/types/plaid.js';

// PlaidUser is specific to synthetic data generation
// This is the only type unique to the scripts directory
export interface PlaidUser {
  user_id: string;
  name: {
    first: string;
    last: string;
  };
  accounts: import('../../../src/types/plaid.js').PlaidAccount[];
  transactions: import('../../../src/types/plaid.js').PlaidTransaction[];
  liabilities: import('../../../src/types/plaid.js').PlaidLiability[];
}
