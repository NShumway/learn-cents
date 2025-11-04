# Phase 2: Core Functionality - Part 1

**Stories 4-7** - Build core processing logic: signal detection, persona assignment, assessment engine, and client-side generation.

---

## Story 4: Behavioral Signal Detection

### Goals
- Research and document specific detection criteria for all 7 personas
- Implement detection algorithms working with JSON/CSV files
- Detect behavioral signals for: subscriptions, savings, credit, income, overdrafts
- Calculate signals for 30-day and 180-day windows
- Output relevant signal data (not all raw data)
- Store all insight text in central location for legal review

### Research & Documentation Component

Before implementing, create comprehensive documentation in `docs/signal-detection.md`:

#### Required Research:
1. **Subscription Detection**
   - Define: What constitutes a "recurring" transaction?
   - Cadence detection: Weekly, bi-weekly, monthly, quarterly?
   - Tolerance: How many days variance for "monthly" (e.g., ±3 days)?
   - Minimum occurrences: ≥3 in 90 days?
   - Amount consistency: Must amounts be identical or allow variance?

2. **Savings Signals**
   - Growth rate calculation: (end_balance - start_balance) / start_balance?
   - Minimum threshold for "positive growth": ≥2%?
   - Net inflow threshold: ≥$200/month?
   - Emergency fund coverage: savings_balance / average_monthly_expenses
   - Which account types count as "savings"? (savings, money market, HSA)

3. **Credit Signals**
   - Utilization calculation: balance / limit
   - Flag thresholds: 30%, 50%, 80% - flag all or just store value?
   - Minimum payment detection: How to identify from transactions?
   - Interest charge detection: Look for "INTEREST CHARGE" in description?
   - Overdue detection: From liability data `is_overdue` field

4. **Income Stability**
   - Payroll detection: Categories like "INCOME_PAYROLL"?
   - Payment frequency: Detect bi-weekly vs monthly vs irregular?
   - Median pay gap calculation: How to compute from irregular deposits?
   - Cash-flow buffer: checking_balance / average_monthly_expenses?

5. **Overdraft Patterns**
   - Detection: Negative balances OR transactions with "OVERDRAFT"/"NSF" in name?
   - Frequency threshold: ≥1 in 30d? ≥2 in 180d?
   - What data to store: Count, amounts, dates?

#### Documentation Output (`docs/signal-detection.md`):
```markdown
# Signal Detection Specification

## Version 1.0

This document defines the exact criteria for detecting behavioral signals.
All thresholds and detection logic must be implemented exactly as specified.

### 1. Subscription Detection

**Definition**: A recurring transaction is...
[Document all criteria discovered in research]

### 2. Savings Signals

**Growth Rate**:
- Formula: (end_balance - start_balance) / start_balance
- Threshold: ≥2% over 180-day window
[etc.]

### 3. Credit Signals
[etc.]

### 4. Income Stability
[etc.]

### 5. Overdraft Patterns
[etc.]

### Signal Output Format

Each signal detector returns:
```typescript
{
  detected: boolean,
  evidence: {
    // Relevant data only - not all raw transactions
    // Examples:
    // For subscriptions: [{ merchant, amount, cadence, lastChargeDate }]
    // For credit: { utilization: 68, balance: 3400, limit: 5000 }
  },
  window: '30d' | '180d'
}
```
```

### File Structure

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
└── index.ts                        # Export all feature detection

docs/
└── signal-detection.md             # Specification (created during research)

tests/
└── features/
    └── signals/
        ├── subscriptionDetector.test.ts
        ├── savingsDetector.test.ts
        └── [etc.]
```

### Implementation Details

#### 1. Signal Types (features/signals/types.ts)

```typescript
export interface SignalEvidence {
  [key: string]: any; // Flexible structure for different signal types
}

export interface SignalResult {
  detected: boolean;
  evidence: SignalEvidence;
  window: '30d' | '180d';
}

export interface SubscriptionEvidence {
  subscriptions: Array<{
    merchant: string;
    amount: number;
    cadence: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
    lastChargeDate: string;
    count: number; // Number of occurrences detected
  }>;
  totalMonthlySpend: number;
  subscriptionShareOfSpend: number; // Percentage
}

export interface CreditEvidence {
  accounts: Array<{
    accountId: string;
    mask: string;
    utilization: number; // Percentage
    balance: number;
    limit: number;
    minimumPaymentOnly: boolean;
    hasInterestCharges: boolean;
    isOverdue: boolean;
  }>;
  maxUtilization: number;
  avgUtilization: number;
}

export interface SavingsEvidence {
  accounts: Array<{
    accountId: string;
    type: string;
    startBalance: number;
    endBalance: number;
    growthRate: number; // Percentage
    netInflow: number;
  }>;
  totalSavings: number;
  emergencyFundCoverage: number; // Months of expenses
}

export interface IncomeEvidence {
  payrollTransactions: Array<{
    date: string;
    amount: number;
  }>;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular';
  medianPayGap: number; // Days
  averageIncome: number;
  cashFlowBuffer: number; // Months
}

export interface OverdraftEvidence {
  incidents: Array<{
    date: string;
    amount: number;
    type: 'negative_balance' | 'nsf_fee' | 'overdraft_fee';
  }>;
  count30d: number;
  count180d: number;
  totalFees: number;
}

// Import Plaid types
import type { PlaidAccount, PlaidTransaction, PlaidLiability } from '../../scripts/lib/types/plaidData';

export interface UserFinancialData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

export interface DetectedSignals {
  subscriptions30d: SignalResult<SubscriptionEvidence>;
  subscriptions180d: SignalResult<SubscriptionEvidence>;
  savings30d: SignalResult<SavingsEvidence>;
  savings180d: SignalResult<SavingsEvidence>;
  credit30d: SignalResult<CreditEvidence>;
  credit180d: SignalResult<CreditEvidence>;
  income30d: SignalResult<IncomeEvidence>;
  income180d: SignalResult<IncomeEvidence>;
  overdrafts30d: SignalResult<OverdraftEvidence>;
  overdrafts180d: SignalResult<OverdraftEvidence>;
}
```

#### 2. Main Signal Detector (features/signals/index.ts)

```typescript
import { detectSubscriptions } from './subscriptionDetector';
import { detectSavings } from './savingsDetector';
import { detectCredit } from './creditDetector';
import { detectIncome } from './incomeDetector';
import { detectOverdrafts } from './overdraftDetector';
import { getTransactionsInWindow, getWindow } from '../utils/dateUtils';
import type { UserFinancialData, DetectedSignals } from './types';

/**
 * Main signal detection orchestrator
 * Analyzes user financial data and detects behavioral signals
 * for both 30-day and 180-day windows
 */
export async function detectAllSignals(data: UserFinancialData): Promise<DetectedSignals> {
  const now = new Date();

  // Get transactions for each window
  const transactions30d = getTransactionsInWindow(data.transactions, 30, now);
  const transactions180d = getTransactionsInWindow(data.transactions, 180, now);

  // Run all detectors for both windows
  const [
    subscriptions30d,
    subscriptions180d,
    savings30d,
    savings180d,
    credit30d,
    credit180d,
    income30d,
    income180d,
    overdrafts30d,
    overdrafts180d
  ] = await Promise.all([
    detectSubscriptions(transactions30d, data.accounts, '30d'),
    detectSubscriptions(transactions180d, data.accounts, '180d'),
    detectSavings(transactions30d, data.accounts, '30d'),
    detectSavings(transactions180d, data.accounts, '180d'),
    detectCredit(transactions30d, data.accounts, data.liabilities, '30d'),
    detectCredit(transactions180d, data.accounts, data.liabilities, '180d'),
    detectIncome(transactions30d, data.accounts, '30d'),
    detectIncome(transactions180d, data.accounts, '180d'),
    detectOverdrafts(transactions30d, data.accounts, '30d'),
    detectOverdrafts(transactions180d, data.accounts, '180d')
  ]);

  return {
    subscriptions30d,
    subscriptions180d,
    savings30d,
    savings180d,
    credit30d,
    credit180d,
    income30d,
    income180d,
    overdrafts30d,
    overdrafts180d
  };
}
```

#### 3. Subscription Detector Stub (features/signals/subscriptionDetector.ts)

```typescript
import type { PlaidTransaction, PlaidAccount } from '../../scripts/lib/types/plaidData';
import type { SignalResult, SubscriptionEvidence } from './types';

/**
 * Detects recurring subscription transactions
 *
 * Implementation will be based on criteria documented in docs/signal-detection.md
 * after research phase is complete.
 *
 * Detection logic (to be finalized):
 * - Group transactions by merchant (case-insensitive)
 * - Detect cadence (weekly, monthly, etc.) based on date patterns
 * - Require minimum occurrences (≥3 in window?)
 * - Calculate subscription share of total spend
 */
export async function detectSubscriptions(
  transactions: PlaidTransaction[],
  accounts: PlaidAccount[],
  window: '30d' | '180d'
): Promise<SignalResult<SubscriptionEvidence>> {
  // TODO: Implement based on docs/signal-detection.md

  // Stub return for now
  return {
    detected: false,
    evidence: {
      subscriptions: [],
      totalMonthlySpend: 0,
      subscriptionShareOfSpend: 0
    },
    window
  };
}

// Helper: Group transactions by merchant (case-insensitive)
function groupByMerchant(transactions: PlaidTransaction[]): Map<string, PlaidTransaction[]> {
  const groups = new Map<string, PlaidTransaction[]>();

  for (const tx of transactions) {
    const merchant = (tx.merchant_name || tx.name || 'Unknown').toLowerCase();
    if (!groups.has(merchant)) {
      groups.set(merchant, []);
    }
    groups.get(merchant)!.push(tx);
  }

  return groups;
}

// Helper: Detect cadence from transaction dates
function detectCadence(transactions: PlaidTransaction[]): 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | null {
  // TODO: Implement cadence detection logic
  // Sort by date, calculate gaps between transactions, determine pattern
  return null;
}
```

#### 4. Date Utilities (features/utils/dateUtils.ts)

```typescript
import type { PlaidTransaction } from '../../scripts/lib/types/plaidData';

/**
 * Get transactions within a specific time window
 */
export function getTransactionsInWindow(
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

/**
 * Get start and end dates for a window
 */
export function getWindow(days: number, endDate: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(endDate);
  const start = new Date(endDate);
  start.setDate(start.getDate() - days);

  return { start, end };
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Sort transactions by date (newest first)
 */
export function sortTransactionsByDate(
  transactions: PlaidTransaction[],
  order: 'asc' | 'desc' = 'desc'
): PlaidTransaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}
```

#### 5. CLI Test Script (scripts/testSignalDetection.ts)

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import { detectAllSignals } from '../features/signals';
import type { SyntheticDataset } from './lib/types/plaidData';

async function main() {
  const args = process.argv.slice(2);
  const dataFile = args[0] || './data/synthetic-users.json';

  console.log('Loading synthetic data...');
  const raw = await fs.readFile(dataFile, 'utf-8');
  const dataset: SyntheticDataset = JSON.parse(raw);

  console.log(`Testing signal detection on ${dataset.users.length} users\n`);

  // Test on first user for now
  const user = dataset.users[0];
  console.log(`User: ${user.name.first} ${user.name.last}`);
  console.log(`Accounts: ${user.accounts.length}`);
  console.log(`Transactions: ${user.transactions.length}`);
  console.log(`Liabilities: ${user.liabilities.length}\n`);

  console.log('Detecting signals...');
  const signals = await detectAllSignals({
    accounts: user.accounts,
    transactions: user.transactions,
    liabilities: user.liabilities
  });

  console.log('\nDetected Signals (180-day window):');
  console.log('- Subscriptions:', signals.subscriptions180d.detected);
  console.log('- Savings:', signals.savings180d.detected);
  console.log('- Credit Issues:', signals.credit180d.detected);
  console.log('- Income Stability:', signals.income180d.detected);
  console.log('- Overdrafts:', signals.overdrafts180d.detected);

  // Output detailed evidence
  console.log('\nDetailed Evidence:');
  console.log(JSON.stringify(signals, null, 2));
}

main().catch(console.error);
```

#### 6. Add to package.json

```json
{
  "scripts": {
    "test:signals": "tsx scripts/testSignalDetection.ts"
  }
}
```

### Acceptance Criteria

- [ ] Research completed and documented in `docs/signal-detection.md`
- [ ] All signal detectors implemented per specification
- [ ] Subscription detection with case-insensitive merchant matching
- [ ] All 5 signal types detect patterns correctly
- [ ] Both 30-day and 180-day windows calculated
- [ ] Signal output includes relevant data (not all raw data)
- [ ] CLI test script runs successfully
- [ ] Unit tests for each detector pass
- [ ] Documentation reviewed for clarity

### Testing

```typescript
// tests/features/signals/subscriptionDetector.test.ts
import { describe, it, expect } from 'vitest';
import { detectSubscriptions } from '../../../features/signals/subscriptionDetector';
import type { PlaidTransaction } from '../../../scripts/lib/types/plaidData';

describe('Subscription Detection', () => {
  it('detects monthly recurring subscriptions', async () => {
    const transactions: PlaidTransaction[] = [
      {
        transaction_id: 't1',
        account_id: 'acc1',
        date: '2024-01-15',
        amount: 9.99,
        merchant_name: 'Netflix',
        name: 'NETFLIX.COM',
        payment_channel: 'online',
        personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'STREAMING' },
        pending: false,
        merchant_entity_id: null
      },
      {
        transaction_id: 't2',
        account_id: 'acc1',
        date: '2024-02-15',
        amount: 9.99,
        merchant_name: 'Netflix',
        name: 'NETFLIX.COM',
        payment_channel: 'online',
        personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'STREAMING' },
        pending: false,
        merchant_entity_id: null
      },
      {
        transaction_id: 't3',
        account_id: 'acc1',
        date: '2024-03-15',
        amount: 9.99,
        merchant_name: 'Netflix',
        name: 'NETFLIX.COM',
        payment_channel: 'online',
        personal_finance_category: { primary: 'ENTERTAINMENT', detailed: 'STREAMING' },
        pending: false,
        merchant_entity_id: null
      }
    ];

    const result = await detectSubscriptions(transactions, [], '180d');

    expect(result.detected).toBe(true);
    expect(result.evidence.subscriptions.length).toBeGreaterThan(0);
    expect(result.evidence.subscriptions[0].merchant.toLowerCase()).toContain('netflix');
    expect(result.evidence.subscriptions[0].cadence).toBe('monthly');
  });

  it('handles case-insensitive merchant matching', async () => {
    // Test with different case variations
    // Netflix, NETFLIX, netflix should all match
  });

  // TODO: Add more test cases based on documented criteria
});
```

---

## Story 5: Persona Assignment Logic

### Goals
- Research and document persona assignment criteria for all 7 personas
- Implement assignment logic that supports multiple persona matches
- Define static priority ordering across all personas
- Output all matching personas with priority insight first

### Research & Documentation Component

Create `docs/persona-assignment.md` with detailed criteria:

#### Required Research:
1. **High Utilization**
   - Exact criteria: utilization ≥50% OR interest charges > 0 OR minimum-payment-only OR is_overdue?
   - Should ALL be checked or just ANY?
   - Which signals trigger this persona?

2. **Frequent Overdrafts**
   - Threshold: How many overdrafts in what window?
   - ≥1 in 30d? ≥2 in 180d?
   - Do NSF fees count separately from negative balances?

3. **Variable Income Budgeter**
   - Median pay gap: How to calculate from transactions?
   - Cash-flow buffer: checking_balance / avg_monthly_expenses?
   - Threshold: >45 days AND <1 month buffer?

4. **Subscription-Heavy**
   - Criteria: ≥3 recurring merchants AND (monthly spend ≥$50 OR subscription share ≥10%)?
   - How to calculate "subscription share"?

5. **Savings Builder**
   - Criteria: Growth rate ≥2% OR net inflow ≥$200/month, AND all card utilizations <30%?
   - Must ALL credit cards be <30% or just average?

6. **Blank Slate**
   - Threshold: <30 transactions in 180 days?
   - Should this check all accounts or just primary checking?

7. **General**
   - Automatic assignment if no other personas match?

8. **Priority Ordering**
   - Define static order for ALL personas
   - PDF suggests: High Utilization > Variable Income > Subscription > Savings
   - Insert Frequent Overdrafts and Blank Slate where?
   - General always last?

#### Documentation Output (`docs/persona-assignment.md`):
```markdown
# Persona Assignment Specification

## Version 1.0

### Personas (7 Total)

Users can match MULTIPLE personas. All matching personas generate insights.
The first insight shown is the PRIORITY INSIGHT based on static ordering below.

### Static Priority Ordering

1. High Utilization (highest priority)
2. Frequent Overdrafts
3. Variable Income Budgeter
4. Subscription-Heavy
5. Savings Builder
6. Blank Slate
7. General (lowest priority, catch-all)

### Assignment Criteria

#### 1. High Utilization
**Triggers when**: [Define exact criteria from research]

**Signals checked**:
- credit180d: utilization ≥50% on any card
- credit180d: interest charges detected
- credit180d: minimum payment only
- credit180d: is_overdue = true

**Educational focus**: Reduce utilization, payment planning, autopay

#### 2. Frequent Overdrafts
[etc. for each persona]

### Assignment Algorithm

```typescript
function assignPersonas(signals: DetectedSignals): AssignedPersona[] {
  const matched: AssignedPersona[] = [];

  // Check each persona in any order (priority applied later)
  if (matchesHighUtilization(signals)) {
    matched.push({ type: 'High Utilization', priority: 1, ... });
  }

  if (matchesFrequentOverdrafts(signals)) {
    matched.push({ type: 'Frequent Overdrafts', priority: 2, ... });
  }

  // ... check all personas

  // If no matches, assign General
  if (matched.length === 0) {
    matched.push({ type: 'General', priority: 7, ... });
  }

  // Sort by priority
  return matched.sort((a, b) => a.priority - b.priority);
}
```
```

### File Structure

```
personas/
├── index.ts                  # Main persona assignment orchestrator
├── criteria.ts               # Persona matching criteria
├── types.ts                  # Persona type definitions
└── personaDefinitions.ts     # Persona metadata (names, descriptions, priorities)

docs/
└── persona-assignment.md     # Specification (created during research)

tests/
└── personas/
    ├── criteria.test.ts
    └── index.test.ts
```

### Implementation Details

#### 1. Persona Types (personas/types.ts)

```typescript
import type { DetectedSignals } from '../features/signals/types';

export type PersonaType =
  | 'High Utilization'
  | 'Frequent Overdrafts'
  | 'Variable Income Budgeter'
  | 'Subscription-Heavy'
  | 'Savings Builder'
  | 'Blank Slate'
  | 'General';

export interface PersonaMatch {
  type: PersonaType;
  priority: number; // 1 = highest
  matchedCriteria: string[]; // Which criteria triggered this match
  signals: DetectedSignals; // Reference to signals that matched
}

export interface AssignedPersonas {
  primary: PersonaMatch; // Highest priority match
  additional: PersonaMatch[]; // Other matches, sorted by priority
}
```

#### 2. Persona Definitions (personas/personaDefinitions.ts)

```typescript
import type { PersonaType } from './types';

export interface PersonaDefinition {
  type: PersonaType;
  priority: number;
  displayName: string;
  description: string;
  educationalFocus: string[];
}

// Static persona definitions with priority ordering
export const PERSONA_DEFINITIONS: PersonaDefinition[] = [
  {
    type: 'High Utilization',
    priority: 1,
    displayName: 'High Credit Utilization',
    description: 'Credit card usage needs attention',
    educationalFocus: [
      'Reduce credit card utilization below 30%',
      'Set up autopay for minimum payments',
      'Understand impact of utilization on credit score'
    ]
  },
  {
    type: 'Frequent Overdrafts',
    priority: 2,
    displayName: 'Frequent Overdrafts',
    description: 'Account balance management needs improvement',
    educationalFocus: [
      'Build cash buffer in checking account',
      'Set up low balance alerts',
      'Review overdraft protection options'
    ]
  },
  {
    type: 'Variable Income Budgeter',
    priority: 3,
    displayName: 'Variable Income',
    description: 'Income fluctuates, budgeting strategy needed',
    educationalFocus: [
      'Percent-based budgeting for variable income',
      'Build emergency fund for income gaps',
      'Smoothing strategies for irregular paychecks'
    ]
  },
  {
    type: 'Subscription-Heavy',
    priority: 4,
    displayName: 'Subscription Management',
    description: 'Multiple recurring subscriptions detected',
    educationalFocus: [
      'Audit active subscriptions',
      'Negotiate or cancel unused services',
      'Set up bill alerts for recurring charges'
    ]
  },
  {
    type: 'Savings Builder',
    priority: 5,
    displayName: 'Savings Builder',
    description: 'Positive savings habits detected',
    educationalFocus: [
      'Set specific savings goals',
      'Automate savings transfers',
      'Optimize APY with high-yield savings accounts'
    ]
  },
  {
    type: 'Blank Slate',
    priority: 6,
    displayName: 'Getting Started',
    description: 'Limited transaction history, foundational guidance',
    educationalFocus: [
      'Budgeting basics for beginners',
      'Building good financial habits',
      'Understanding checking vs savings accounts'
    ]
  },
  {
    type: 'General',
    priority: 7,
    displayName: 'General Financial Wellness',
    description: 'Overall financial health guidance',
    educationalFocus: [
      'General money management tips',
      'Building financial literacy',
      'Exploring partner offers'
    ]
  }
];

export function getPersonaDefinition(type: PersonaType): PersonaDefinition {
  const def = PERSONA_DEFINITIONS.find(p => p.type === type);
  if (!def) throw new Error(`Unknown persona type: ${type}`);
  return def;
}
```

#### 3. Persona Criteria (personas/criteria.ts)

```typescript
import type { DetectedSignals } from '../features/signals/types';
import type { PersonaMatch, PersonaType } from './types';
import { getPersonaDefinition } from './personaDefinitions';

/**
 * Check if user matches High Utilization persona
 * Implementation based on docs/persona-assignment.md criteria
 */
export function matchesHighUtilization(signals: DetectedSignals): PersonaMatch | null {
  const matchedCriteria: string[] = [];
  const { credit180d } = signals;

  if (!credit180d.detected) return null;

  // Check criteria (to be finalized in docs)
  // Example: utilization ≥50% OR interest charges > 0 OR minimum-payment-only OR is_overdue

  const hasHighUtil = credit180d.evidence.accounts.some(acc => acc.utilization >= 50);
  const hasInterest = credit180d.evidence.accounts.some(acc => acc.hasInterestCharges);
  const minPaymentOnly = credit180d.evidence.accounts.some(acc => acc.minimumPaymentOnly);
  const isOverdue = credit180d.evidence.accounts.some(acc => acc.isOverdue);

  if (hasHighUtil) matchedCriteria.push('Utilization ≥50%');
  if (hasInterest) matchedCriteria.push('Interest charges detected');
  if (minPaymentOnly) matchedCriteria.push('Minimum payment only');
  if (isOverdue) matchedCriteria.push('Overdue payment');

  if (matchedCriteria.length === 0) return null;

  const def = getPersonaDefinition('High Utilization');
  return {
    type: 'High Utilization',
    priority: def.priority,
    matchedCriteria,
    signals
  };
}

// TODO: Implement other persona matchers based on documented criteria
export function matchesFrequentOverdrafts(signals: DetectedSignals): PersonaMatch | null {
  // TODO: Implement
  return null;
}

export function matchesVariableIncome(signals: DetectedSignals): PersonaMatch | null {
  // TODO: Implement
  return null;
}

export function matchesSubscriptionHeavy(signals: DetectedSignals): PersonaMatch | null {
  // TODO: Implement
  return null;
}

export function matchesSavingsBuilder(signals: DetectedSignals): PersonaMatch | null {
  // TODO: Implement
  return null;
}

export function matchesBlankSlate(signals: DetectedSignals): PersonaMatch | null {
  // TODO: Implement
  return null;
}
```

#### 4. Main Assignment Logic (personas/index.ts)

```typescript
import type { DetectedSignals } from '../features/signals/types';
import type { AssignedPersonas, PersonaMatch } from './types';
import {
  matchesHighUtilization,
  matchesFrequentOverdrafts,
  matchesVariableIncome,
  matchesSubscriptionHeavy,
  matchesSavingsBuilder,
  matchesBlankSlate
} from './criteria';
import { getPersonaDefinition } from './personaDefinitions';

/**
 * Assign personas to user based on detected signals
 *
 * Users can match multiple personas.
 * Returns primary (highest priority) and additional personas.
 */
export function assignPersonas(signals: DetectedSignals): AssignedPersonas {
  const matches: PersonaMatch[] = [];

  // Check all persona criteria
  const highUtil = matchesHighUtilization(signals);
  const overdrafts = matchesFrequentOverdrafts(signals);
  const variableIncome = matchesVariableIncome(signals);
  const subscriptions = matchesSubscriptionHeavy(signals);
  const savings = matchesSavingsBuilder(signals);
  const blankSlate = matchesBlankSlate(signals);

  if (highUtil) matches.push(highUtil);
  if (overdrafts) matches.push(overdrafts);
  if (variableIncome) matches.push(variableIncome);
  if (subscriptions) matches.push(subscriptions);
  if (savings) matches.push(savings);
  if (blankSlate) matches.push(blankSlate);

  // If no matches, assign General persona
  if (matches.length === 0) {
    const def = getPersonaDefinition('General');
    matches.push({
      type: 'General',
      priority: def.priority,
      matchedCriteria: ['Default assignment - no specific patterns detected'],
      signals
    });
  }

  // Sort by priority (lowest number = highest priority)
  matches.sort((a, b) => a.priority - b.priority);

  return {
    primary: matches[0],
    additional: matches.slice(1)
  };
}
```

#### 5. CLI Test Script (scripts/testPersonaAssignment.ts)

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import { detectAllSignals } from '../features/signals';
import { assignPersonas } from '../personas';
import type { SyntheticDataset } from './lib/types/plaidData';

async function main() {
  const dataFile = process.argv[2] || './data/synthetic-users.json';

  const raw = await fs.readFile(dataFile, 'utf-8');
  const dataset: SyntheticDataset = JSON.parse(raw);

  console.log('Testing persona assignment on all users\n');

  for (const user of dataset.users) {
    const signals = await detectAllSignals({
      accounts: user.accounts,
      transactions: user.transactions,
      liabilities: user.liabilities
    });

    const personas = assignPersonas(signals);

    console.log(`User: ${user.name.first} ${user.name.last}`);
    console.log(`  Primary: ${personas.primary.type}`);
    console.log(`  Criteria: ${personas.primary.matchedCriteria.join(', ')}`);

    if (personas.additional.length > 0) {
      console.log(`  Additional: ${personas.additional.map(p => p.type).join(', ')}`);
    }
    console.log('');
  }
}

main().catch(console.error);
```

### Acceptance Criteria

- [ ] Research completed and documented in `docs/persona-assignment.md`
- [ ] All 7 persona criteria implemented
- [ ] Static priority ordering defined and documented
- [ ] Assignment supports multiple persona matches
- [ ] Primary persona correctly identified (highest priority)
- [ ] General persona assigned when no matches
- [ ] CLI test script runs on all synthetic users
- [ ] Unit tests for all persona criteria pass

### Testing

```typescript
// tests/personas/criteria.test.ts
import { describe, it, expect } from 'vitest';
import { matchesHighUtilization } from '../../personas/criteria';
import type { DetectedSignals } from '../../features/signals/types';

describe('Persona Criteria', () => {
  describe('High Utilization', () => {
    it('matches when utilization ≥50%', () => {
      const signals: DetectedSignals = {
        // ... setup signals with high utilization
      };

      const match = matchesHighUtilization(signals);

      expect(match).not.toBeNull();
      expect(match?.type).toBe('High Utilization');
      expect(match?.matchedCriteria).toContain('Utilization ≥50%');
    });

    // TODO: Add more test cases
  });
});
```

---

## Story 6: Assessment Engine Core

### Goals
- Generate assessment with underlying data structures for each persona
- Calculate eligibility metrics for partner offers
- Build rendering functions for user display and AI context
- Create decision trees showing why each persona was assigned
- Hardcode education content per persona
- Centralize all insight text for legal review

### File Structure

```
recommend/
├── index.ts                        # Main assessment engine
├── assessmentBuilder.ts            # Build assessment from personas
├── eligibilityCalculator.ts        # Calculate offer eligibility metrics
├── decisionTree.ts                 # Generate decision trace
├── renderingFunctions/
│   ├── highUtilization.ts          # Render High Utilization insights
│   ├── frequentOverdrafts.ts       # Render Frequent Overdrafts insights
│   ├── variableIncome.ts           # Render Variable Income insights
│   ├── subscriptionHeavy.ts        # Render Subscription insights
│   ├── savingsBuilder.ts           # Render Savings Builder insights
│   ├── blankSlate.ts               # Render Blank Slate insights
│   ├── general.ts                  # Render General insights
│   └── types.ts                    # Rendering function types
├── content/
│   └── insightText.ts              # CENTRAL LOCATION - All insight text for legal review
└── types.ts                        # Assessment type definitions

docs/
└── assessment-structure.md         # Assessment data structure specification

tests/
└── recommend/
    ├── assessmentBuilder.test.ts
    └── renderingFunctions/
```

### Implementation Details

#### 1. Insight Text - CENTRAL LOCATION (recommend/content/insightText.ts)

```typescript
/**
 * CENTRAL LOCATION FOR ALL INSIGHT TEXT
 *
 * ALL user-facing text must be defined here for legal review.
 * No insight text should be hardcoded elsewhere in the application.
 *
 * Text uses template variables for data insertion:
 * - {variable} = insert data
 * - Use rendering functions to populate variables
 */

export const LEGAL_DISCLAIMER =
  "This is educational content, not financial advice. Consult a licensed advisor for personalized guidance.";

export const HIGH_UTILIZATION_TEXT = {
  title: "Reduce Credit Card Utilization",
  summary: "Your credit card usage is high, which could impact your credit score and result in interest charges.",
  detailedInsight: (data: { cards: Array<{ mask: string; utilization: number; balance: number; limit: number; interest: number }> }) => `
We noticed you have {cardCount} credit card(s) with high utilization:

{cardList}

Bringing your utilization below 30% could improve your credit score and reduce interest charges.
  `.trim(),

  educationItems: [
    {
      title: "Understanding Credit Utilization",
      description: "Learn how credit card utilization affects your credit score and financial health."
    },
    {
      title: "Debt Paydown Strategies",
      description: "Strategies for paying down credit card debt efficiently, including avalanche and snowball methods."
    },
    {
      title: "Setting Up Autopay",
      description: "How to set up automatic payments to avoid missed payments and late fees."
    }
  ]
};

export const FREQUENT_OVERDRAFTS_TEXT = {
  title: "Manage Account Overdrafts",
  summary: "We detected overdraft fees or negative balances in your checking account.",
  detailedInsight: (data: { incidents: Array<{ date: string; amount: number; type: string }>; totalFees: number }) => `
In the last 180 days, you had {incidentCount} overdraft incident(s), resulting in ${data.totalFees.toFixed(2)} in fees.

Building a cash buffer in your checking account can help avoid these fees.
  `.trim(),

  educationItems: [
    {
      title: "Building a Cash Buffer",
      description: "Strategies for maintaining a minimum balance to avoid overdrafts."
    },
    {
      title: "Low Balance Alerts",
      description: "How to set up alerts to notify you when your balance is low."
    },
    {
      title: "Overdraft Protection Options",
      description: "Understanding different overdraft protection options and their costs."
    }
  ]
};

// TODO: Add text for all other personas
export const VARIABLE_INCOME_TEXT = { /* ... */ };
export const SUBSCRIPTION_HEAVY_TEXT = { /* ... */ };
export const SAVINGS_BUILDER_TEXT = { /* ... */ };
export const BLANK_SLATE_TEXT = { /* ... */ };
export const GENERAL_TEXT = { /* ... */ };

/**
 * Partner offer text templates
 * (Will be populated from PartnerOffer catalog in later story)
 */
export interface PartnerOfferText {
  offerName: string;
  pitch: string; // Direct from catalog
}
```

#### 2. Assessment Types (recommend/types.ts)

```typescript
import type { PersonaMatch } from '../personas/types';
import type { DetectedSignals } from '../features/signals/types';

/**
 * Assessment - the complete analysis for a user
 * This is what gets stored in the database
 */
export interface Assessment {
  priorityInsight: Insight;
  additionalInsights: Insight[];
  eligibilityMetrics: EligibilityMetrics;
  decisionTree: DecisionTree;
}

/**
 * Insight - one persona-based recommendation
 */
export interface Insight {
  personaType: string;
  priority: number;

  // Underlying data (stored in DB)
  underlyingData: any; // Flexible structure per persona

  // Rendered text (generated on-demand, not stored)
  renderedForUser?: string;
  renderedForAI?: string;

  // Education and offers
  educationItems: EducationItem[];
  partnerOffers: PartnerOfferReference[];
}

/**
 * Education item
 */
export interface EducationItem {
  title: string;
  description: string;
  // Future: url, category, etc.
}

/**
 * Partner offer reference
 * (Actual offer comes from PartnerOffer catalog)
 */
export interface PartnerOfferReference {
  offerId: string;
  offerName: string;
  eligible: boolean;
  rationale: string; // Why user is/isn't eligible
}

/**
 * Eligibility metrics - stored with assessment
 * Used to determine which partner offers to show
 */
export interface EligibilityMetrics {
  // Credit metrics
  maxCreditUtilization: number;
  avgCreditUtilization: number;
  totalCreditBalance: number;
  totalCreditLimit: number;
  totalInterestPaid: number;

  // Savings metrics
  totalSavingsBalance: number;
  emergencyFundCoverage: number; // Months

  // Income metrics
  estimatedMonthlyIncome: number;
  incomeStability: 'stable' | 'variable' | 'unknown';

  // Existing accounts
  hasCheckingAccount: boolean;
  hasSavingsAccount: boolean;
  hasCreditCard: boolean;
  hasMoneyMarket: boolean;
  hasHSA: boolean;
}

/**
 * Decision tree - explains why personas were assigned
 */
export interface DecisionTree {
  signalsDetected: string[]; // List of signals that fired
  personasConsidered: Array<{
    persona: string;
    matched: boolean;
    criteria: string[]; // Which criteria matched/didn't match
  }>;
  priorityReasoning: string; // Why this persona is priority
}
```

#### 3. Rendering Functions Example (recommend/renderingFunctions/highUtilization.ts)

```typescript
import type { Insight } from '../types';
import { HIGH_UTILIZATION_TEXT } from '../content/insightText';

/**
 * Render High Utilization insight for user display
 */
export function renderForUser(insight: Insight): string {
  const { underlyingData } = insight;

  // Build card list with data insertion
  const cardList = underlyingData.cards
    .map((card: any) =>
      `- Card ending in ${card.mask}: ${card.utilization}% utilization ($${card.balance.toFixed(2)} of $${card.limit.toFixed(2)} limit)${card.interest > 0 ? `, $${card.interest.toFixed(2)}/month in interest` : ''}`
    )
    .join('\n');

  const text = HIGH_UTILIZATION_TEXT.detailedInsight(underlyingData)
    .replace('{cardCount}', underlyingData.cards.length.toString())
    .replace('{cardList}', cardList);

  return text;
}

/**
 * Render High Utilization insight for AI context
 */
export function renderForAI(insight: Insight): string {
  const { underlyingData } = insight;

  return `
PERSONA: High Credit Utilization

DATA:
${JSON.stringify(underlyingData, null, 2)}

INSIGHT: ${HIGH_UTILIZATION_TEXT.summary}

USER IS SHOWN:
${renderForUser(insight)}

EDUCATION TOPICS:
${HIGH_UTILIZATION_TEXT.educationItems.map(e => `- ${e.title}: ${e.description}`).join('\n')}
  `.trim();
}
```

#### 4. Assessment Builder (recommend/assessmentBuilder.ts)

```typescript
import type { AssignedPersonas } from '../personas/types';
import type { DetectedSignals } from '../features/signals/types';
import type { Assessment, Insight } from './types';
import { calculateEligibilityMetrics } from './eligibilityCalculator';
import { buildDecisionTree } from './decisionTree';
import { buildInsight } from './insightBuilder';

/**
 * Build complete assessment from assigned personas and signals
 */
export async function buildAssessment(
  personas: AssignedPersonas,
  signals: DetectedSignals
): Promise<Assessment> {
  // Build insights for all personas
  const priorityInsight = await buildInsight(personas.primary, signals);
  const additionalInsights = await Promise.all(
    personas.additional.map(p => buildInsight(p, signals))
  );

  // Calculate eligibility metrics
  const eligibilityMetrics = calculateEligibilityMetrics(signals);

  // Build decision tree
  const decisionTree = buildDecisionTree(personas, signals);

  return {
    priorityInsight,
    additionalInsights,
    eligibilityMetrics,
    decisionTree
  };
}
```

#### 5. Eligibility Calculator Stub (recommend/eligibilityCalculator.ts)

```typescript
import type { DetectedSignals } from '../features/signals/types';
import type { EligibilityMetrics } from './types';

/**
 * Calculate eligibility metrics from signals
 * These metrics are used to determine which partner offers to show
 */
export function calculateEligibilityMetrics(signals: DetectedSignals): EligibilityMetrics {
  const { credit180d, savings180d, income180d } = signals;

  return {
    // Credit metrics
    maxCreditUtilization: credit180d.detected
      ? Math.max(...credit180d.evidence.accounts.map(a => a.utilization))
      : 0,
    avgCreditUtilization: credit180d.detected
      ? credit180d.evidence.avgUtilization
      : 0,
    totalCreditBalance: credit180d.detected
      ? credit180d.evidence.accounts.reduce((sum, a) => sum + a.balance, 0)
      : 0,
    totalCreditLimit: credit180d.detected
      ? credit180d.evidence.accounts.reduce((sum, a) => sum + a.limit, 0)
      : 0,
    totalInterestPaid: credit180d.detected
      ? credit180d.evidence.accounts.reduce((sum, a) => sum + (a.hasInterestCharges ? 50 : 0), 0) // Estimate
      : 0,

    // Savings metrics
    totalSavingsBalance: savings180d.detected
      ? savings180d.evidence.totalSavings
      : 0,
    emergencyFundCoverage: savings180d.detected
      ? savings180d.evidence.emergencyFundCoverage
      : 0,

    // Income metrics
    estimatedMonthlyIncome: income180d.detected
      ? income180d.evidence.averageIncome
      : 0,
    incomeStability: income180d.detected
      ? (income180d.evidence.frequency === 'irregular' ? 'variable' : 'stable')
      : 'unknown',

    // Existing accounts (stub - will be implemented)
    hasCheckingAccount: true, // TODO: Detect from accounts
    hasSavingsAccount: savings180d.detected,
    hasCreditCard: credit180d.detected,
    hasMoneyMarket: false, // TODO: Detect
    hasHSA: false // TODO: Detect
  };
}
```

#### 6. CLI Test Script (scripts/testAssessment.ts)

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import { detectAllSignals } from '../features/signals';
import { assignPersonas } from '../personas';
import { buildAssessment } from '../recommend/assessmentBuilder';
import type { SyntheticDataset } from './lib/types/plaidData';

async function main() {
  const dataFile = process.argv[2] || './data/synthetic-users.json';

  const raw = await fs.readFile(dataFile, 'utf-8');
  const dataset: SyntheticDataset = JSON.parse(raw);

  // Test on first user
  const user = dataset.users[0];
  console.log(`Building assessment for: ${user.name.first} ${user.name.last}\n`);

  const signals = await detectAllSignals({
    accounts: user.accounts,
    transactions: user.transactions,
    liabilities: user.liabilities
  });

  const personas = assignPersonas(signals);
  const assessment = await buildAssessment(personas, signals);

  console.log('ASSESSMENT COMPLETE\n');
  console.log('Priority Insight:', assessment.priorityInsight.personaType);
  console.log('Additional Insights:', assessment.additionalInsights.map(i => i.personaType).join(', '));
  console.log('\nEligibility Metrics:');
  console.log(JSON.stringify(assessment.eligibilityMetrics, null, 2));
  console.log('\nDecision Tree:');
  console.log(JSON.stringify(assessment.decisionTree, null, 2));
}

main().catch(console.error);
```

### Acceptance Criteria

- [ ] Assessment data structure finalized and documented
- [ ] All insight text centralized in `recommend/content/insightText.ts`
- [ ] Rendering functions implemented for all 7 personas
- [ ] Education items hardcoded for each persona (3-5 items)
- [ ] Eligibility metrics calculator working
- [ ] Decision tree generator working
- [ ] Assessment builder creates complete assessment
- [ ] CLI test script generates full assessment
- [ ] Unit tests pass

### Testing

- CLI testing with synthetic data
- Unit tests for rendering functions
- Verify all text goes through central location

---

## Story 7: CLI Assessment Generation

### Goals
- Build CLI-based assessment generation using JSON/CSV files (NO Plaid yet - that's Phase 4)
- Create file parsers for JSON and CSV formats
- Integrate parsers with assessment engine
- Generate complete assessment via CLI in <1 second (target)
- Test full pipeline on synthetic data
- Verify data processing and flushing works correctly

### File Structure

```
ingest/
├── index.ts                    # Main data ingestion orchestrator
├── jsonParser.ts               # JSON file parser
├── csvParser.ts                # CSV file parser
├── dataValidator.ts            # Validate input data matches expected schema
└── types.ts                    # Ingestion types

scripts/
└── generateAssessment.ts       # CLI script to generate assessment from file

tests/
└── ingest/
    ├── jsonParser.test.ts
    ├── csvParser.test.ts
    └── dataValidator.test.ts
```

### Implementation Details

#### 1. JSON Parser (ingest/jsonParser.ts)

```typescript
import fs from 'fs/promises';
import type { PlaidAccount, PlaidTransaction, PlaidLiability } from '../scripts/lib/types/plaidData';

export interface UserFinancialData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

/**
 * Parse JSON file containing financial data
 * Expects Plaid-format JSON structure
 */
export async function parseJSON(filePath: string): Promise<UserFinancialData> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Handle both single-user and SyntheticDataset formats
  if (data.users && Array.isArray(data.users)) {
    // SyntheticDataset format - use first user
    const user = data.users[0];
    return {
      accounts: user.accounts || [],
      transactions: user.transactions || [],
      liabilities: user.liabilities || []
    };
  }

  // Single user format
  return {
    accounts: data.accounts || [],
    transactions: data.transactions || [],
    liabilities: data.liabilities || []
  };
}
```

#### 2. CSV Parser Stub (ingest/csvParser.ts)

```typescript
import fs from 'fs/promises';
import type { UserFinancialData } from './jsonParser';

/**
 * Parse CSV file containing financial data
 *
 * TODO: Implement CSV parsing logic
 * For now, this is a placeholder - CSV support can be added later if needed
 */
export async function parseCSV(filePath: string): Promise<UserFinancialData> {
  throw new Error('CSV parsing not yet implemented - use JSON format');
}
```

#### 3. Data Validator (ingest/dataValidator.ts)

```typescript
import type { UserFinancialData } from './jsonParser';

/**
 * Validate that ingested data matches expected schema
 * Throws error if validation fails
 */
export function validateData(data: UserFinancialData): void {
  if (!data) {
    throw new Error('No data provided');
  }

  if (!Array.isArray(data.accounts)) {
    throw new Error('Invalid data: accounts must be an array');
  }

  if (!Array.isArray(data.transactions)) {
    throw new Error('Invalid data: transactions must be an array');
  }

  if (!Array.isArray(data.liabilities)) {
    throw new Error('Invalid data: liabilities must be an array');
  }

  // Validate at least one account exists
  if (data.accounts.length === 0) {
    throw new Error('No accounts found in data');
  }

  console.log(`✓ Data validation passed: ${data.accounts.length} accounts, ${data.transactions.length} transactions`);
}
```

#### 4. Main Ingestion Orchestrator (ingest/index.ts)

```typescript
import { parseJSON } from './jsonParser';
import { parseCSV } from './csvParser';
import { validateData } from './dataValidator';
import type { UserFinancialData } from './jsonParser';
import { sortTransactionsByDate } from '../features/utils/dateUtils';

export type DataSource = 'json' | 'csv';

export interface IngestionOptions {
  source: DataSource;
  filePath: string;
}

/**
 * Ingest financial data from JSON or CSV file
 * Validates and sorts transactions by date (newest first)
 */
export async function ingestData(options: IngestionOptions): Promise<UserFinancialData> {
  let data: UserFinancialData;

  // Parse from source
  switch (options.source) {
    case 'json':
      data = await parseJSON(options.filePath);
      break;

    case 'csv':
      data = await parseCSV(options.filePath);
      break;

    default:
      throw new Error(`Unknown data source: ${options.source}`);
  }

  // Validate structure
  validateData(data);

  // Sort transactions by date (for proper window calculations)
  data.transactions = sortTransactionsByDate(data.transactions, 'desc');

  return data;
}
```

#### 5. Assessment Generation Pipeline (features/index.ts)

```typescript
/**
 * MAIN ASSESSMENT GENERATION PIPELINE
 *
 * This orchestrator ties everything together:
 * 1. Ingest data from file
 * 2. Detect signals
 * 3. Assign personas
 * 4. Build assessment
 * 5. FLUSH all raw data
 * 6. Return only assessment
 */

import { ingestData, type IngestionOptions } from '../ingest';
import { detectAllSignals } from './signals';
import { assignPersonas } from '../personas';
import { buildAssessment } from '../recommend/assessmentBuilder';
import type { Assessment } from '../recommend/types';

export interface GenerateAssessmentOptions extends IngestionOptions {
  onProgress?: (stage: string, percent: number) => void;
}

/**
 * Generate assessment from financial data file
 * For CLI testing - will adapt for browser in Phase 4
 */
export async function generateAssessment(
  options: GenerateAssessmentOptions
): Promise<Assessment> {
  const { onProgress } = options;

  try {
    // Stage 1: Ingest data (0-30%)
    onProgress?.('Loading financial data', 0);
    const data = await ingestData(options);
    onProgress?.('Data loaded', 30);

    // Stage 2: Detect signals (30-60%)
    onProgress?.('Analyzing patterns', 40);
    const signals = await detectAllSignals(data);
    onProgress?.('Patterns detected', 60);

    // Stage 3: Assign personas (60-80%)
    onProgress?.('Identifying insights', 70);
    const personas = assignPersonas(signals);
    onProgress?.('Insights identified', 80);

    // Stage 4: Build assessment (80-95%)
    onProgress?.('Generating recommendations', 85);
    const assessment = await buildAssessment(personas, signals);
    onProgress?.('Assessment complete', 95);

    // Stage 5: FLUSH raw data
    // Clear all references to allow garbage collection
    data.accounts = [];
    data.transactions = [];
    data.liabilities = [];

    onProgress?.('Finalizing', 100);

    // Return ONLY assessment (no raw data)
    return assessment;

  } catch (error) {
    console.error('Assessment generation failed:', error);
    throw error;
  }
}
```

#### 6. CLI Script (scripts/generateAssessment.ts)

```typescript
#!/usr/bin/env tsx

/**
 * CLI tool to generate assessment from JSON/CSV file
 * Tests complete pipeline: ingest → detect → assign → build
 */

import { generateAssessment } from '../features';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm run generate:assessment <file.json>');
    console.log('       npm run generate:assessment <file.csv>');
    process.exit(1);
  }

  const filePath = args[0];
  const source = filePath.endsWith('.csv') ? 'csv' : 'json';

  console.log(`Generating assessment from ${filePath}\n`);

  const startTime = Date.now();

  // Generate assessment
  const assessment = await generateAssessment({
    source,
    filePath,
    onProgress: (stage, percent) => {
      console.log(`[${percent}%] ${stage}`);
    }
  });

  const duration = Date.now() - startTime;

  console.log(`\n✓ Assessment generated in ${duration}ms`);
  console.log(`  Target: <1000ms ${duration < 1000 ? '✓' : '⚠️'}\n`);

  console.log('ASSESSMENT SUMMARY:');
  console.log('─────────────────────────────────────');
  console.log(`Priority Insight: ${assessment.priorityInsight.personaType}`);

  if (assessment.additionalInsights.length > 0) {
    console.log(`Additional Insights: ${assessment.additionalInsights.map(i => i.personaType).join(', ')}`);
  }

  console.log('\nEligibility Metrics:');
  console.log(`  Max Credit Utilization: ${assessment.eligibilityMetrics.maxCreditUtilization}%`);
  console.log(`  Total Savings: $${assessment.eligibilityMetrics.totalSavingsBalance.toFixed(2)}`);
  console.log(`  Estimated Monthly Income: $${assessment.eligibilityMetrics.estimatedMonthlyIncome.toFixed(2)}`);
  console.log(`  Income Stability: ${assessment.eligibilityMetrics.incomeStability}`);

  console.log('\nDecision Tree:');
  console.log(`  Signals Detected: ${assessment.decisionTree.signalsDetected.join(', ')}`);
  console.log(`  Priority Reasoning: ${assessment.decisionTree.priorityReasoning}`);
}

main().catch(console.error);
```

#### 7. Add to package.json

```json
{
  "scripts": {
    "generate:assessment": "tsx scripts/generateAssessment.ts"
  }
}
```

### Acceptance Criteria

- [ ] JSON parser handles both single-user and SyntheticDataset formats
- [ ] CSV parser stub created (can be implemented later if needed)
- [ ] Data validator checks for required fields
- [ ] Transactions sorted by date after loading
- [ ] Complete pipeline generates assessment from file
- [ ] Performance target: <1 second for typical user (flexible for large datasets)
- [ ] All raw financial data flushed after processing
- [ ] Only assessment object remains in memory
- [ ] CLI script runs successfully with file argument
- [ ] Progress callback updates correctly

### Testing

```bash
# Generate assessment from synthetic data
npm run generate:assessment ./data/synthetic-users.json

# Expected output:
# Generating assessment from ./data/synthetic-users.json
#
# [0%] Loading financial data
# ✓ Data validation passed: 3 accounts, 487 transactions
# [30%] Data loaded
# [40%] Analyzing patterns
# [60%] Patterns detected
# [70%] Identifying insights
# [80%] Insights identified
# [85%] Generating recommendations
# [95%] Assessment complete
# [100%] Finalizing
#
# ✓ Assessment generated in 847ms
#   Target: <1000ms ✓
#
# ASSESSMENT SUMMARY:
# ─────────────────────────────────────
# Priority Insight: High Utilization
# Additional Insights: Subscription-Heavy, Savings Builder
#
# Eligibility Metrics:
#   Max Credit Utilization: 68%
#   Total Savings: $3,450.00
#   Estimated Monthly Income: $4,200.00
#   Income Stability: stable
#
# Decision Tree:
#   Signals Detected: credit-high-util, subscriptions, savings-growth
#   Priority Reasoning: High Utilization (priority 1) matched first
```

---

## Phase 2 Completion Checklist

### Story 4: Behavioral Signal Detection
- [ ] Research documented in `docs/signal-detection.md`
- [ ] All 5 signal types implemented
- [ ] 30-day and 180-day windows calculated
- [ ] Signal outputs include relevant data only
- [ ] CLI test script works
- [ ] Unit tests pass

### Story 5: Persona Assignment Logic
- [ ] Research documented in `docs/persona-assignment.md`
- [ ] All 7 persona criteria implemented
- [ ] Static priority ordering defined
- [ ] Multiple persona matches supported
- [ ] CLI test script works
- [ ] Unit tests pass

### Story 6: Assessment Engine Core
- [ ] All insight text centralized in one file
- [ ] Rendering functions for all personas
- [ ] Education items hardcoded (3-5 per persona)
- [ ] Eligibility metrics calculator working
- [ ] Decision tree generator working
- [ ] CLI test script works
- [ ] Unit tests pass

### Story 7: CLI Assessment Generation
- [ ] JSON parser working (handles single-user and dataset formats)
- [ ] CSV parser stub created
- [ ] Data validator working
- [ ] Full pipeline generates assessment from file
- [ ] Performance <1s for typical user
- [ ] Data flushing verified
- [ ] CLI script works with file argument
- [ ] Integration tests pass

### Integration Test
- [ ] Run complete pipeline on 100 synthetic users
- [ ] Verify all personas get assigned
- [ ] Verify 100% coverage (General persona catches all)
- [ ] Performance acceptable across all test users
- [ ] No memory leaks (data properly flushed)

---

## Next Steps

After completing Phase 2, move to Phase 3: Core Functionality - Part 2 (Stories 8-11)
See `phases_3.md` for detailed implementation guide.
