# Signal Detection Specification

**Version:** 2.0
**Date:** November 4, 2025
**Status:** Implemented

## Overview

This document defines the exact criteria for detecting behavioral signals from financial data. All thresholds and detection logic are implemented in `src/signals/`.

## Signal Types

We detect 6 behavioral signal types across 30-day and 180-day windows:

1. **Subscriptions** - Recurring payment patterns
2. **Savings** - Savings account growth and health
3. **Credit** - Credit card utilization and payment behavior
4. **Income** - Income stability and payment frequency
5. **Overdrafts** - Negative balances and fees
6. **Banking Activity** - Low-use detection based on payment patterns

## Detection Criteria

### 1. Subscription Detection

**Definition:** A recurring transaction is a payment to the same merchant (case-insensitive) that occurs at regular intervals.

**Data Sources:**
- Plaid's `/transactions/recurring/get` API (when available)
- Custom pattern detection (fallback/supplement)
- Deduplicated to avoid flagging same subscription twice

**Criteria:**
- Minimum occurrences: ≥3 transactions in the window
- Cadence detection:
  - Weekly: 7 days ±2 days
  - Bi-weekly: 14 days ±3 days
  - Monthly: 30 days ±5 days
- Amount consistency: Within ±15% of median amount
- Merchant matching: Case-insensitive, trimmed whitespace
- Filters: Only outbound payments (positive amounts)

**Output:**
```typescript
{
  detected: boolean,
  evidence: {
    subscriptions: [
      {
        merchant: string,
        amount: number,
        cadence: 'weekly' | 'biweekly' | 'monthly',
        lastChargeDate: string,
        count: number
      }
    ],
    totalMonthlySpend: number,
    subscriptionShareOfSpend: number  // Percentage
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** ≥1 recurring subscription found

**Note:** Quarterly subscriptions not detected (insufficient window size for reliable detection)

### 2. Savings Signals

**Definition:** Positive savings behavior based on account balance growth and net inflows.

**Account Types Considered:**
- `subtype === 'savings'`
- `subtype === 'money market'`
- `subtype === 'hsa'`

**Criteria:**
- Growth rate: `(endBalance - startBalance) / startBalance`
- Positive growth threshold: ≥2% over 180-day window
- Net inflow threshold: ≥$200/month average
- Emergency fund coverage: `savingsBalance / averageMonthlyExpenses`

**Output:**
```typescript
{
  detected: boolean,
  evidence: {
    accounts: [
      {
        accountId: string,
        type: string,
        startBalance: number,
        endBalance: number,
        growthRate: number,      // Percentage
        netInflow: number
      }
    ],
    totalSavings: number,
    emergencyFundCoverage: number  // Months
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** Growth rate ≥2% OR net inflow ≥$200/month

### 3. Credit Signals

**Definition:** Credit card utilization, payment behavior, and debt indicators.

**Account Types:** `type === 'credit'`

**Criteria:**
- Per-account utilization: `balance / limit * 100`
- Overall utilization: `(sum of all balances) / (sum of all limits) * 100`
- Utilization buckets:
  - `under_30`: < 30%
  - `30_to_50`: 30-50%
  - `50_to_80`: 50-80%
  - `over_80`: ≥ 80%
- Interest charges: Look for `hasInterestCharges` in liabilities
- Minimum payment only: Compare `last_payment_amount` to `minimum_payment_amount`
- Overdue: Check `is_overdue` field in liabilities

**Output:**
```typescript
{
  detected: boolean,
  evidence: {
    accounts: [
      {
        accountId: string,
        mask: string,
        utilizationBucket: 'under_30' | '30_to_50' | '50_to_80' | 'over_80',
        utilizationPercent: number,  // Raw percentage (for overall calc)
        balance: number,
        limit: number,
        minimumPaymentOnly: boolean,
        hasInterestCharges: boolean,
        isOverdue: boolean
      }
    ],
    overallUtilization: {
      percent: number,
      bucket: 'under_30' | '30_to_50' | '50_to_80' | 'over_80'
    }
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** Any account with bucket `50_to_80` OR `over_80` OR interest charges OR minimum payment only OR is overdue

**Note:** Overall utilization used for persona assignment (e.g., Building Saver requires overall < 30%)

### 4. Income Stability

**Definition:** Income payment frequency and consistency.

**Transaction Categories:**
- `personal_finance_category.primary === 'INCOME'`
- Preferably `personal_finance_category.detailed === 'INCOME_PAYROLL'`

**Criteria:**
- Frequency detection:
  - Weekly: Average 7 days between deposits (±2 days)
  - Bi-weekly: Average 14 days between deposits (±3 days)
  - Monthly: Average 30 days between deposits (±5 days)
  - Irregular: >45 days median gap OR high variance
- Median pay gap: Median days between income deposits
- Cash-flow buffer: `checkingBalance / averageMonthlyExpenses`

**Output:**
```typescript
{
  detected: boolean,
  evidence: {
    payrollTransactions: [
      {
        date: string,
        amount: number
      }
    ],
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular',
    medianPayGap: number,     // Days
    averageIncome: number,
    cashFlowBuffer: number    // Months
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** Median pay gap >45 days OR frequency === 'irregular'

### 5. Overdraft Patterns

**Definition:** Negative balances or overdraft/NSF fees.

**Account Types:** `subtype === 'checking'` (primary focus)

**Detection Methods:**
- Negative balance: `balances.current < 0` OR `balances.available < 0`
- Transaction name contains: "OVERDRAFT", "NSF", "INSUFFICIENT FUNDS"

**Criteria:**
- Count incidents in window
- Track total fees paid
- Store incident dates and amounts

**Output:**
```typescript
{
  detected: boolean,
  evidence: {
    incidents: [
      {
        date: string,
        amount: number,
        type: 'negative_balance' | 'nsf_fee' | 'overdraft_fee'
      }
    ],
    count30d: number,
    count180d: number,
    totalFees: number
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** ≥1 incident in 30d OR ≥2 incidents in 180d

### 6. Banking Activity

**Definition:** Detects low-use banking patterns based on outbound payment activity.

**Account Types:** All accounts (aggregated view)

**Criteria:**
- Count only outbound payments (positive amounts = debits/spending)
- Income deposits (negative amounts) are excluded
- Unique merchants counted from outbound payments only
- Low-Use threshold:
  - outboundPaymentCount180d < 10 AND
  - outboundPaymentCount30d < 5 AND
  - uniquePaymentMerchants < 5

**Output:**
```typescript
{
  detected: boolean,  // True = Low-Use
  evidence: {
    outboundPaymentCount30d: number,
    outboundPaymentCount180d: number,
    uniquePaymentMerchants: number
  },
  window: '30d' | '180d'
}
```

**Detection threshold:** All three criteria must be met for Low-Use detection

**Exemptions:**
- Recent activity: If ≥5 payments in last 30d → NOT low-use
- Merchant diversity: If ≥5 unique merchants → NOT low-use
- Volume: If ≥10 payments in 180d → NOT low-use

## Open Questions

### Subscription Detection
- [ ] Should we filter by specific categories (e.g., entertainment, utilities)?
- [ ] How to handle amount changes (price increases)?
- [ ] Should we detect annual subscriptions?

### Savings Signals
- [ ] How to calculate "average monthly expenses" without historical data?
- [ ] Should we require minimum balance thresholds?
- [ ] Should CD accounts count as savings?

### Credit Signals
- [ ] How to detect "minimum payment only" from transaction data alone?
- [ ] Should we flag any utilization >30% or just store the value?
- [ ] How to estimate interest paid from transaction descriptions?

### Income Stability
- [ ] Should we include other income sources beyond payroll?
- [ ] How to handle gig workers with daily/weekly deposits?
- [ ] What constitutes "high variance" in income?

### Overdraft Patterns
- [ ] Should we weight recent overdrafts more heavily?
- [ ] Should we track overdraft recovery time?
- [ ] Are there grace periods to consider?

## Implementation Notes

### Date Window Calculations

```typescript
// Get transactions in window
function getTransactionsInWindow(
  transactions: PlaidTransaction[],
  days: number,
  endDate: Date = new Date()
): PlaidTransaction[] {
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);

  return transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startDate && txDate <= endDate;
  });
}
```

### Merchant Normalization

```typescript
function normalizeMerchant(name: string): string {
  return name.toLowerCase().trim();
}
```

### Amount Comparison

```typescript
function isAmountConsistent(amount: number, median: number, tolerance = 0.15): boolean {
  const diff = Math.abs(amount - median) / median;
  return diff <= tolerance;
}
```

## File Structure

```
features/
├── signals/
│   ├── index.ts                    # Main signal detection orchestrator
│   ├── subscriptionDetector.ts     # Subscription detection
│   ├── savingsDetector.ts          # Savings signals
│   ├── creditDetector.ts           # Credit signals
│   ├── incomeDetector.ts           # Income stability
│   ├── overdraftDetector.ts        # Overdraft patterns
│   └── types.ts                    # Signal type definitions
├── utils/
│   ├── dateUtils.ts                # Date range, window calculations
│   └── transactionUtils.ts         # Transaction filtering, grouping
```

## Testing Strategy

Each detector should have unit tests covering:

1. **Positive Cases:** Signal correctly detected
2. **Negative Cases:** Signal not present
3. **Edge Cases:**
   - Empty data
   - Insufficient data (< minimum occurrences)
   - Boundary conditions (exactly at threshold)
4. **Data Quality:**
   - Missing fields
   - Null values
   - Invalid dates

## Next Steps

1. Review and finalize open questions
2. Implement detector stubs with documented criteria
3. Create unit tests for each detector
4. Implement detection algorithms
5. Test with synthetic data
6. Refine thresholds based on test results

## References

- Plaid data structure: `docs/plaid-data-structure.md`
- Phase 2 requirements: `planning/phase-2.md`
- Plaid category taxonomy: https://plaid.com/documents/transactions-personal-finance-category-taxonomy.csv
