# Plaid Data Structure Reference

**Generated:** November 4, 2025
**Purpose:** Document the data structures used by all downstream processes (signal detection, persona assignment, assessment generation)

## Overview

This document defines the standardized data structures that all downstream processes consume. Whether data comes from Plaid API, synthetic generators, or user file uploads, it follows the formats defined here.

## Complete User Financial Data Bundle

All downstream processes receive data in this bundled format:

```typescript
interface PlaidUserData {
  metadata: {
    fetched_at: string; // ISO timestamp
    environment: string; // "sandbox" | "production" | "synthetic"
    institution?: string; // Institution name (if applicable)
  };
  accounts: PlaidAccount[]; // All user accounts
  transactions: PlaidTransaction[]; // All transactions
  liabilities?: PlaidLiability[]; // Credit cards, loans (optional)
  summary: {
    total_accounts: number;
    total_transactions: number;
  };
}
```

**Access Pattern:**

```typescript
// Read the bundled data
const userData = JSON.parse(fs.readFileSync('data/plaid-user-data.json', 'utf-8'));

// Access components
const accounts = userData.accounts;
const transactions = userData.transactions;
const liabilities = userData.liabilities || [];
```

**Available Data Files:**

- `data/plaid-user-data.json` - Current user data
- `data/synthetic-users.json` - Test dataset with multiple users

## Account Structure

### PlaidAccount

```typescript
interface PlaidAccount {
  account_id: string; // Unique identifier
  type: string; // Account type
  subtype: string; // Account subtype
  name: string; // Display name
  mask: string; // Last 4 digits
  balances: {
    available: number | null; // Available balance
    current: number; // Current balance
    limit: number | null; // Credit limit (for credit accounts)
    iso_currency_code: string; // Currency code (e.g., "USD")
  };
  holder_category?: string; // "personal" | "business"
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
  transaction_id: string; // Unique identifier
  account_id: string; // Associated account
  date: string; // Transaction date (YYYY-MM-DD)
  amount: number; // Amount (positive = debit, negative = credit)
  merchant_name: string | null; // Merchant name
  merchant_entity_id: string | null; // Plaid merchant ID
  payment_channel: string; // Payment method
  personal_finance_category: {
    primary: string; // Primary category
    detailed: string; // Detailed subcategory
  };
  pending: boolean; // Is transaction pending?
  name: string; // Transaction description
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
  account_id: string; // Links to account
  type: 'credit' | 'student' | 'mortgage'; // Liability type

  // Credit card specific
  aprs?: Array<{
    apr_type: string; // APR type
    apr_percentage: number; // APR percentage
  }>;
  minimum_payment_amount?: number; // Minimum payment due
  last_payment_amount?: number; // Last payment amount
  is_overdue?: boolean; // Is account overdue?
  next_payment_due_date?: string; // Next payment date
  last_statement_balance?: number; // Last statement balance

  // Loan specific
  interest_rate?: number; // Interest rate percentage
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
  "minimum_payment_amount": 20.0,
  "is_overdue": false
}
```

## Multi-User Dataset Format

The synthetic data generator creates test datasets with multiple users:

```typescript
interface SyntheticDataset {
  users: Array<{
    user_id: string;
    name: { first: string; last: string };
    accounts: PlaidAccount[];
    transactions: PlaidTransaction[];
    liabilities: PlaidLiability[];
  }>;
  generated_at: string;
  count: number;
}
```

**Access Pattern:**

```typescript
// Read multi-user dataset
const dataset = JSON.parse(fs.readFileSync('data/synthetic-users.json', 'utf-8'));

// Process first user
const user = dataset.users[0];
const accounts = user.accounts;
const transactions = user.transactions;

// Or iterate all users
dataset.users.forEach((user) => {
  // Process each user's data
});
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

Downstream processes should accept both formats:

1. **Single User Format** (`PlaidUserData`) - Direct from Plaid or file upload
2. **Multi-User Format** (`SyntheticDataset`) - From synthetic generator

Parsers should detect format and extract user data accordingly.

## Data File Conventions

**Single User Data:**

- `data/plaid-user-data.json` - Current/latest user financial data

**Multi-User Test Data:**

- `data/synthetic-users.json` - Generated test dataset

**Test Fixtures:**

- `data/test-*.json` - Specific test cases

## Usage Examples

### Signal Detection

```typescript
import { detectSubscriptions, detectSavingsPatterns } from './signals';

const userData = JSON.parse(fs.readFileSync('data/plaid-user-data.json', 'utf-8'));
const subscriptions = detectSubscriptions(userData.transactions);
const savingsSignals = detectSavingsPatterns(userData.accounts, userData.transactions);
```

### Persona Assignment

```typescript
import { assignPersona } from './personas';

const userData = JSON.parse(fs.readFileSync('data/plaid-user-data.json', 'utf-8'));
const persona = assignPersona({
  accounts: userData.accounts,
  transactions: userData.transactions,
  liabilities: userData.liabilities,
});
```

### Assessment Generation

```typescript
import { generateAssessment } from './assessment';

const userData = JSON.parse(fs.readFileSync('data/plaid-user-data.json', 'utf-8'));
const assessment = generateAssessment(userData);
```

## Generating Fresh Data

**From Plaid Sandbox:**

```bash
npm run explore:plaid
# Outputs to: data/plaid-user-data.json
```

**From Synthetic Generator:**

```bash
npm run generate:data
# Outputs to: data/synthetic-users.json
```
