# Assessment Object Structure

**Version:** 2.0
**Date:** November 4, 2025
**Status:** Current

## Overview

This document defines the complete structure of the assessment object generated after signal detection and persona assignment. This is the base data structure that will be stored and used throughout the system.

## Complete Structure

```typescript
interface Assessment {
  // Metadata
  userId: string;
  userName: string;
  generatedAt: string; // ISO 8601 timestamp

  // Signal detection results
  signals: DetectedSignals;

  // Persona assignment result
  persona: {
    personas: PersonaAssignment[]; // Ordered by priority, [0] is primary
    decisionTree: DecisionTree;
  };
}
```

## Signal Structure

All signals follow the same pattern: two time windows (30d and 180d) with detection flag and evidence.

### Income Signal (Updated)

**Key Change:** Income transactions are aggregated into 15-day buckets to reduce data storage while maintaining visibility into income variability.

```typescript
income: {
  '30d': {
    detected: boolean,
    evidence: {
      incomeBuckets: Array<{
        startDate: string;      // YYYY-MM-DD
        endDate: string;        // YYYY-MM-DD
        totalIncome: number;    // Sum of all income in this bucket
      }>,
      frequency: 'weekly' | 'biweekly' | 'monthly' | 'irregular',
      medianPayGap: number,     // Days between income deposits
      averageIncome: number,    // Average income amount
      cashFlowBuffer: number    // Months of expenses in checking
    },
    window: '30d'
  },
  '180d': { /* same structure */ }
}
```

**Example:**
```json
{
  "incomeBuckets": [
    {
      "startDate": "2025-10-05",
      "endDate": "2025-10-19",
      "totalIncome": 43502.14
    },
    {
      "startDate": "2025-10-20",
      "endDate": "2025-11-03",
      "totalIncome": 28889.22
    }
  ],
  "frequency": "irregular",
  "medianPayGap": 1,
  "averageIncome": 3046.26,
  "cashFlowBuffer": 0.07
}
```

**Rationale:**
- **30d window** = 2 buckets (15 days each)
- **180d window** = 12 buckets (15 days each)
- Only includes buckets with income (sparse representation)
- Preserves enough granularity to detect variable income patterns
- Significantly reduces data size vs. storing individual transactions

### Other Signals

See `src/types/signals.ts` for complete signal definitions:
- `subscriptions` - Recurring payment detection
- `savings` - Savings account growth
- `credit` - Credit utilization and health
- `overdrafts` - Overdraft incidents
- `bankingActivity` - Banking engagement levels

## Persona Structure (Updated)

**Key Changes:**
1. **Removed confidence scores** - Matching is binary (match/no-match)
2. **Array-based structure** - Personas stored as ordered array instead of primary/additional

```typescript
persona: {
  personas: Array<{
    persona: PersonaType;
    reasoning: string[];    // Why this persona matched
    evidence: {            // Data that triggered the match
      [key: string]: any;
    };
  }>,
  decisionTree: {
    signalsDetected: string[];
    personasEvaluated: DecisionNode[];
    primaryPersona: PersonaType;
    reasoning: string;
  }
}
```

**Key Points:**
- `personas[0]` is ALWAYS the primary persona (highest priority match)
- Subsequent entries are additional matching personas in priority order
- If only one persona matches, array has length 1
- Binary matching: either matches criteria or doesn't (no confidence score)

**Example:**
```json
{
  "personas": [
    {
      "persona": "high_utilization",
      "reasoning": [
        "1 card(s) with 50%+ utilization (max: 81%)"
      ],
      "evidence": {
        "highUtilizationAccounts": [
          {
            "mask": "9194",
            "utilization": 81.48,
            "bucket": "over_80"
          }
        ],
        "accountsAffected": 1,
        "totalBalance": 2801.81,
        "overallUtilization": 67.19
      }
    }
  ]
}
```

## File Size

Typical assessment object sizes:
- **User with high utilization**: ~5.3 KB
- **User with no personas (Steady)**: ~5.3 KB

The 15-day bucketing reduced income data from storing potentially hundreds of transaction objects to 2-12 simple aggregates.

## Data Privacy

The assessment object stores:
- ✅ Aggregated financial metrics
- ✅ Date ranges (not specific transaction dates)
- ✅ Bucketed income totals
- ✅ Account masks (last 4 digits)
- ❌ No individual transaction details (except subscription identification)
- ❌ No merchant names (except for subscriptions)
- ❌ No full account numbers

## Usage

### CLI
```bash
# Generate and view assessment
npm run view:assessment 0

# Outputs to: data/assessment-user-{index}.json
```

### Programmatic
```typescript
import { detectAllSignals } from './signals';
import { assignPersona } from './personas';

const signals = detectAllSignals(userData);
const personaResult = assignPersona(signals);

const assessment = {
  userId: user.user_id,
  userName: `${user.name.first} ${user.name.last}`,
  generatedAt: new Date().toISOString(),
  signals,
  persona: personaResult,
};
```

## Changes from v1.0

1. **Income bucketing** - Individual transactions replaced with 15-day aggregates
2. **No confidence scores** - Removed arbitrary scoring, binary matching only
3. **Array-based personas** - Simplified structure, personas[0] is primary
4. **Smaller file size** - Reduced from ~23KB to ~5.3KB per user

## Next Steps

When building the full assessment engine (Stories 6-7), additional fields will be added:
- Eligibility metrics
- Rendered insights
- Education content references
- Partner offer eligibility

But the core signal + persona structure defined here will remain the foundation.
