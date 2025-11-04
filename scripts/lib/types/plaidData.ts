// Based on Plaid API structure
export interface PlaidAccount {
  account_id: string;
  type: 'depository' | 'credit' | 'loan';
  subtype: 'checking' | 'savings' | 'credit card' | 'money market' | 'hsa' | 'student' | 'mortgage';
  balances: {
    available: number | null;
    current: number;
    limit: number | null;
    iso_currency_code: string;
  };
  holder_category: 'personal' | 'business';
  name: string;
  mask: string; // Last 4 digits
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  merchant_name: string | null;
  merchant_entity_id: string | null;
  payment_channel: 'online' | 'in store' | 'other';
  personal_finance_category: {
    primary: string;
    detailed: string;
  };
  pending: boolean;
  name: string; // Transaction description
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

export interface PlaidUser {
  user_id: string;
  name: {
    first: string;
    last: string;
  };
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

export interface SyntheticDataset {
  users: PlaidUser[];
  generated_at: string;
  count: number;
}
