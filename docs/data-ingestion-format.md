# Data Ingestion Format Specification

**Version:** 1.0
**Date:** November 4, 2025

## Overview

This document defines the expected file formats for JSON and CSV data ingestion in Phase 2 (Story 7).

## Supported Formats

### 1. JSON Format (Primary)

JSON is the primary format. We support two variants:

#### Single User Format

```json
{
  "user_id": "user_123",
  "name": {
    "first": "John",
    "last": "Doe"
  },
  "accounts": [
    /* array of PlaidAccount */
  ],
  "transactions": [
    /* array of PlaidTransaction */
  ],
  "liabilities": [
    /* array of PlaidLiability */
  ]
}
```

#### Multi-User Dataset Format

Used by synthetic data generator:

```json
{
  "users": [
    {
      "user_id": "user_1",
      "name": { "first": "John", "last": "Doe" },
      "accounts": [],
      "transactions": [],
      "liabilities": []
    }
  ],
  "generated_at": "2025-11-04T12:00:00.000Z",
  "count": 1
}
```

**Parser Behavior:** If JSON has `users` array, parse first user. Otherwise, treat as single user.

### 2. CSV Format (Secondary - Future)

For CSV format, we'll need three separate files:

#### accounts.csv

```csv
account_id,type,subtype,name,mask,available,current,limit,currency
acc_123,depository,checking,Checking Account,7008,4316.16,4316.16,,USD
acc_456,credit,credit card,Credit Card,3333,,410.00,2000.00,USD
```

**Required Columns:**

- `account_id` (string)
- `type` (string: depository, credit, loan, investment)
- `subtype` (string: checking, savings, credit card, etc.)
- `name` (string)
- `mask` (string: last 4 digits)
- `current` (number: current balance)
- `currency` (string: ISO code, default USD)

**Optional Columns:**

- `available` (number: available balance)
- `limit` (number: credit limit for credit accounts)

#### transactions.csv

```csv
transaction_id,account_id,date,amount,merchant_name,merchant_entity_id,payment_channel,category_primary,category_detailed,pending,name
txn_1,acc_123,2025-11-04,101.72,CVS Pharmacy,merchant_xyz,online,FOOD_AND_DRINK,FOOD_AND_DRINK_GROCERIES,false,CVS Pharmacy Purchase
txn_2,acc_123,2025-11-03,-2500.00,Employer,,other,INCOME,INCOME_PAYROLL,false,Payroll Deposit
```

**Required Columns:**

- `transaction_id` (string)
- `account_id` (string: must match an account_id)
- `date` (string: YYYY-MM-DD)
- `amount` (number: positive = debit, negative = credit)
- `name` (string: transaction description)

**Optional Columns:**

- `merchant_name` (string)
- `merchant_entity_id` (string)
- `payment_channel` (string: online, in store, other)
- `category_primary` (string: Plaid category)
- `category_detailed` (string: Plaid detailed category)
- `pending` (boolean: true/false, default false)

#### liabilities.csv

```csv
account_id,type,apr_percentage,minimum_payment,last_payment,is_overdue,next_due_date,last_statement,interest_rate
acc_456,credit,15.24,20.00,50.00,false,2025-12-01,410.00,
acc_789,student,,,,,,,4.5
```

**Required Columns:**

- `account_id` (string: must match an account_id)
- `type` (string: credit, student, mortgage)

**Optional Columns (Credit Cards):**

- `apr_percentage` (number)
- `minimum_payment` (number)
- `last_payment` (number)
- `is_overdue` (boolean: true/false)
- `next_due_date` (string: YYYY-MM-DD)
- `last_statement` (number)

**Optional Columns (Loans):**

- `interest_rate` (number)

## Implementation Notes

### JSON Parser (`ingest/jsonParser.ts`)

```typescript
export async function parseJSON(filePath: string): Promise<UserFinancialData> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Handle multi-user dataset
  if (data.users && Array.isArray(data.users)) {
    const user = data.users[0]; // Use first user
    return {
      accounts: user.accounts || [],
      transactions: user.transactions || [],
      liabilities: user.liabilities || [],
    };
  }

  // Handle single user
  return {
    accounts: data.accounts || [],
    transactions: data.transactions || [],
    liabilities: data.liabilities || [],
  };
}
```

### CSV Parser (`ingest/csvParser.ts`)

**Status:** Stub implementation for Phase 2. Full CSV support can be added in future phase if needed.

For now, the parser will:

1. Throw helpful error directing user to JSON format
2. Document CSV specification for future implementation
3. Allow team to decide if CSV support is needed

```typescript
export async function parseCSV(filePath: string): Promise<UserFinancialData> {
  throw new Error(
    'CSV parsing not yet implemented. Please use JSON format.\n' +
      'See docs/data-ingestion-format.md for JSON format specification.'
  );
}
```

### Data Validation (`ingest/dataValidator.ts`)

Validation checks:

1. **Structure Validation:**
   - `accounts` is array
   - `transactions` is array
   - `liabilities` is array

2. **Content Validation:**
   - At least 1 account exists
   - All transactions reference valid account_id
   - All liabilities reference valid account_id

3. **Field Validation:**
   - Dates are valid YYYY-MM-DD format
   - Amounts are numeric
   - Required fields present

4. **Type Coercion:**
   - Convert string booleans ("true"/"false") to boolean
   - Convert string numbers to numbers
   - Parse date strings

## Usage Examples

### CLI Assessment Generation

```bash
# JSON format (single user)
npm run generate:assessment ./data/user-data.json

# JSON format (multi-user dataset - uses first user)
npm run generate:assessment ./data/synthetic-users.json

# CSV format (future)
npm run generate:assessment ./data/transactions.csv
```

### Programmatic Usage

```typescript
import { ingestData } from './ingest';

// JSON ingestion
const data = await ingestData({
  source: 'json',
  filePath: './data/user-data.json',
});

// CSV ingestion (future)
const data = await ingestData({
  source: 'csv',
  filePath: './data/transactions.csv',
});
```

## File Location Conventions

**Development:**

- `./data/synthetic-users.json` - Generated test data
- `./data/plaid-sandbox-sample.json` - Plaid sandbox sample
- `./data/test-*.json` - Test fixtures

**Production (Phase 4):**

- Data will come directly from Plaid API, not files
- File-based ingestion used only for testing/development

## Validation Error Messages

Clear error messages for common issues:

```typescript
// Missing accounts
throw new Error('No accounts found in data. At least one account is required.');

// Invalid transaction reference
throw new Error(`Transaction ${tx.transaction_id} references unknown account ${tx.account_id}`);

// Invalid date format
throw new Error(`Invalid date format: ${tx.date}. Expected YYYY-MM-DD.`);

// Invalid data type
throw new Error(
  `Invalid amount for transaction ${tx.transaction_id}: expected number, got ${typeof tx.amount}`
);
```

## Future Enhancements

### CSV Support (if needed)

If CSV support becomes a priority:

1. Install CSV parser library: `npm install csv-parse`
2. Implement parsers for each CSV type
3. Handle CSV-specific edge cases:
   - Empty fields
   - Quoted strings with commas
   - Different encodings (UTF-8, Windows-1252)
4. Add CSV validation and transformation

### Excel Support (if needed)

Could add `.xlsx` support using `xlsx` library:

- Parse Excel workbooks
- Support multiple sheets (accounts, transactions, liabilities)
- Handle Excel date formats

### Streaming for Large Files

For very large datasets:

- Implement streaming JSON parser
- Process transactions in batches
- Memory-efficient processing

## Testing

Test files should be created for:

1. **Valid JSON:**
   - Single user format
   - Multi-user dataset format
   - Minimal data (1 account, 0 transactions)
   - Complete data (multiple accounts, transactions, liabilities)

2. **Invalid JSON:**
   - Missing accounts array
   - Invalid transaction references
   - Invalid date formats
   - Invalid data types

3. **Edge Cases:**
   - Empty arrays
   - Null values
   - Very large transaction history (10,000+ transactions)

Test location: `tests/ingest/`

## Summary

- **Primary Format:** JSON (Plaid-compatible structure)
- **Secondary Format:** CSV (stub for now, can implement if needed)
- **Validation:** Strict validation with helpful error messages
- **Performance Target:** Parse and validate 1000 transactions in <100ms
- **Future:** Streaming support for very large files

See `docs/plaid-data-structure.md` for detailed field specifications.
