/**
 * Plaid Data Type Definitions
 *
 * These types match the Plaid API data structures documented in
 * docs/plaid-data-structure.md
 */

export interface PlaidAccount {
  account_id: string;
  type: string;
  subtype: string;
  name: string;
  mask: string;
  balances: {
    available: number | null;
    current: number;
    limit: number | null;
    iso_currency_code: string;
  };
  holder_category?: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string; // YYYY-MM-DD
  amount: number; // positive = debit, negative = credit
  merchant_name: string | null;
  merchant_entity_id: string | null;
  payment_channel: string;
  personal_finance_category: {
    primary: string;
    detailed: string;
  };
  pending: boolean;
  name: string;
}

export interface PlaidLiability {
  account_id: string;
  type: 'credit' | 'student' | 'mortgage';

  // Credit card specific
  aprs?: Array<{
    apr_type: string;
    apr_percentage: number;
  }>;
  minimum_payment_amount?: number;
  last_payment_amount?: number;
  is_overdue?: boolean;
  next_payment_due_date?: string;
  last_statement_balance?: number;

  // Loan specific
  interest_rate?: number;
}

export interface PlaidUserData {
  metadata: {
    fetched_at: string;
    environment: string;
    institution?: string;
  };
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities?: PlaidLiability[];
  summary: {
    total_accounts: number;
    total_transactions: number;
  };
}

export interface SyntheticDataset {
  users: Array<{
    user_id: string;
    name: {
      first: string;
      last: string;
    };
    accounts: PlaidAccount[];
    transactions: PlaidTransaction[];
    liabilities: PlaidLiability[];
  }>;
  generated_at: string;
  count: number;
}

export interface PlaidRecurringStream {
  stream_id: string;
  description: string;
  merchant_name?: string;
  category?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'USER_DETECTED';
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'ANNUALLY' | 'UNKNOWN';
  average_amount: {
    amount: number;
    iso_currency_code: string;
  };
  last_amount: {
    amount: number;
    iso_currency_code: string;
  };
  is_active: boolean;
  transaction_ids: string[];
  first_date: string;
  last_date: string;
}

export interface UserFinancialData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
  recurring_streams?: PlaidRecurringStream[]; // Optional: from Plaid's /transactions/recurring/get
}
