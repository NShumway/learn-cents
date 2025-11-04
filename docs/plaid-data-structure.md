# Plaid Data Structure Analysis

**Generated:** November 4, 2025
**Purpose:** Document the actual Plaid API data structures for Phase 2 implementation

## Overview

This document describes the actual data structures returned by Plaid's Sandbox API, which we'll use to build our signal detection and persona assignment logic.

## Data Sources

1. **Plaid Sandbox API** - Live data from `scripts/explorePlaidSandbox.ts`
2. **Synthetic Data** - Generated test data in `data/synthetic-users.json`

Both follow the same Plaid format described in this document.

## Account Structure

### PlaidAccount

```typescript
interface PlaidAccount {
  account_id: string;              // Unique identifier
  type: string;                    // Account type
  subtype: string;                 // Account subtype
  name: string;                    // Display name
  mask: string;                    // Last 4 digits
  balances: {
    available: number | null;      // Available balance
    current: number;               // Current balance
    limit: number | null;          // Credit limit (for credit accounts)
    iso_currency_code: string;     // Currency code (e.g., "USD")
  };
  holder_category?: string;        // "personal" | "business"
}
```

### Account Types

**Depository Accounts:**
- `checking` - Standard checking account
- `savings` - Savings account
- `money market` - Money market account
- `hsa` - Health Savings Account
- `cash management` - Cash management account
- `cd` - Certificate of Deposit

**Credit Accounts:**
- `credit card` - Credit card account

**Loan Accounts:**
- `student` - Student loan
- `mortgage` - Mortgage loan

**Investment Accounts:**
- `ira` - Individual Retirement Account
- `401k` - 401(k) retirement account

## Transaction Structure

### PlaidTransaction

```typescript
interface PlaidTransaction {
  transaction_id: string;                    // Unique identifier
  account_id: string;                        // Associated account
  date: string;                              // Transaction date (YYYY-MM-DD)
  amount: number;                            // Amount (positive = debit, negative = credit)
  merchant_name: string | null;              // Merchant name
  merchant_entity_id: string | null;         // Plaid merchant ID
  payment_channel: string;                   // Payment method
  personal_finance_category: {
    primary: string;                         // Primary category
    detailed: string;                        // Detailed subcategory
  };
  pending: boolean;                          // Is transaction pending?
  name: string;                              // Transaction description
}
```

### Payment Channels

- `online` - Online transaction
- `in store` - In-person transaction
- `other` - Other payment methods

### Personal Finance Categories

Transaction categories from Plaid's taxonomy. Common examples:

**Primary Categories:**
- `FOOD_AND_DRINK` - Groceries, restaurants, bars
- `ENTERTAINMENT` - Movies, concerts, streaming
- `TRANSPORTATION` - Gas, parking, rideshare
- `TRANSFER_IN` / `TRANSFER_OUT` - Account transfers
- `INCOME` - Payroll, other income
- `GENERAL_SERVICES` - Utilities, phone, internet
- `LOAN_PAYMENTS` - Student loans, mortgages
- `RENT_AND_UTILITIES` - Rent, utilities

**Detailed Categories (examples):**
- `FOOD_AND_DRINK_GROCERIES`
- `FOOD_AND_DRINK_RESTAURANTS`
- `ENTERTAINMENT_VIDEO` (Streaming services)
- `TRANSPORTATION_GAS`
- `INCOME_PAYROLL`
- `TRANSFER_IN_ACCOUNT_TRANSFER`

Full taxonomy: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv

## Liability Structure

### PlaidLiability

```typescript
interface PlaidLiability {
  account_id: string;                        // Links to account
  type: 'credit' | 'student' | 'mortgage';   // Liability type

  // Credit card specific
  aprs?: Array<{
    apr_type: string;                        // APR type
    apr_percentage: number;                  // APR percentage
  }>;
  minimum_payment_amount?: number;           // Minimum payment due
  last_payment_amount?: number;              // Last payment amount
  is_overdue?: boolean;                      // Is account overdue?
  next_payment_due_date?: string;            // Next payment date
  last_statement_balance?: number;           // Last statement balance

  // Loan specific
  interest_rate?: number;                    // Interest rate percentage
}
```

### Example Credit Card Liability

From Plaid Sandbox:
```json
{
  "account_id": "pKeNv18lq8fd138D5dNEI77AL1kae9spMo4jV",
  "aprs": [
    {
      "apr_type": "purchase_apr",
      "apr_percentage": 15.24
    }
  ],
  "minimum_payment_amount": 20.00,
  "is_overdue": false
}
```

## User Data Structure

### SyntheticDataset Format

Our synthetic data generator creates:

```typescript
interface PlaidUser {
  user_id: string;
  name: {
    first: string;
    last: string;
  };
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

interface SyntheticDataset {
  users: PlaidUser[];
  generated_at: string;
  count: number;
}
```

## Key Observations for Phase 2

### For Signal Detection (Story 4)

1. **Subscription Detection:**
   - Use `merchant_name` for case-insensitive matching
   - Look at `date` patterns to detect cadence (weekly, monthly, etc.)
   - Consider amount consistency with some tolerance
   - Filter by relevant categories (e.g., `ENTERTAINMENT_VIDEO` for streaming)

2. **Savings Signals:**
   - Track `balances.current` over time for savings accounts
   - Filter accounts where `type === 'depository'` and `subtype === 'savings'`
   - Calculate growth rates and net inflows

3. **Credit Signals:**
   - Credit card accounts have `type === 'credit'`
   - Utilization = `balances.current / balances.limit`
   - Check `liabilities` for APR, minimum payments, overdue status

4. **Income Stability:**
   - Look for transactions with `personal_finance_category.primary === 'INCOME'`
   - Filter for `INCOME_PAYROLL` specifically
   - Analyze date patterns for payment frequency

5. **Overdraft Detection:**
   - Check for negative `balances.available` or `balances.current`
   - Look for transactions with "OVERDRAFT" or "NSF" in `name`
   - Focus on checking accounts (`subtype === 'checking'`)

### For Data Ingestion (Story 7)

The data format is already JSON-compatible. Key considerations:

1. **JSON Format:** Our synthetic data matches Plaid format exactly
2. **CSV Format:** Will need parsers for:
   - Accounts CSV (one row per account)
   - Transactions CSV (one row per transaction)
   - Liabilities CSV (one row per liability)

3. **Data Validation:**
   - Ensure required fields present
   - Validate date formats (YYYY-MM-DD)
   - Validate numeric fields are numbers

## Sample Data Files

- **Plaid Sandbox Sample:** `data/plaid-sandbox-sample.json`
- **Synthetic Test Data:** `data/synthetic-users.json`

## CLI Tool

Run `npm run explore:plaid` to fetch fresh data from Plaid sandbox and save to `data/plaid-sandbox-sample.json`.

Note: Sandbox accounts may have 0 transactions initially. Use synthetic data for testing signal detection.

## Next Steps

1. ✅ Data structure documented
2. ⏭️ Plan JSON/CSV ingestion format
3. ⏭️ Begin signal detection implementation (Story 4)
