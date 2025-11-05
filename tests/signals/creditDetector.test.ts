/**
 * Tests for Credit Detector
 */

import { describe, it, expect } from 'vitest';
import { detectCredit } from '../../src/signals/creditDetector';
import { PlaidAccount, PlaidLiability } from '../../src/types/plaid';

describe('Credit Detector', () => {
  it('should detect high credit utilization', () => {
    const accounts: PlaidAccount[] = [
      {
        account_id: 'credit_1',
        type: 'credit',
        subtype: 'credit card',
        name: 'Credit Card',
        mask: '1234',
        balances: {
          available: 500,
          current: 1500,
          limit: 2000,
          iso_currency_code: 'USD',
        },
      },
    ];

    const liabilities: PlaidLiability[] = [];

    const result = detectCredit(accounts, liabilities, '30d');

    expect(result.detected).toBe(true);
    expect(result.evidence.accounts[0].utilizationBucket).toBe('50_to_80');
    expect(result.evidence.accounts[0].utilizationPercent).toBe(75);
    expect(result.evidence.overallUtilization.percent).toBe(75);
    expect(result.evidence.overallUtilization.bucket).toBe('50_to_80');
  });

  it('should detect minimum payment only', () => {
    const accounts: PlaidAccount[] = [
      {
        account_id: 'credit_1',
        type: 'credit',
        subtype: 'credit card',
        name: 'Credit Card',
        mask: '1234',
        balances: {
          available: 1500,
          current: 500,
          limit: 2000,
          iso_currency_code: 'USD',
        },
      },
    ];

    const liabilities: PlaidLiability[] = [
      {
        account_id: 'credit_1',
        type: 'credit',
        minimum_payment_amount: 25,
        last_payment_amount: 25,
        aprs: [{ apr_type: 'purchase_apr', apr_percentage: 18.99 }],
      },
    ];

    const result = detectCredit(accounts, liabilities, '30d');

    expect(result.detected).toBe(true);
    expect(result.evidence.accounts[0].minimumPaymentOnly).toBe(true);
    expect(result.evidence.accounts[0].hasInterestCharges).toBe(true);
  });

  it('should not detect for low utilization and full payments', () => {
    const accounts: PlaidAccount[] = [
      {
        account_id: 'credit_1',
        type: 'credit',
        subtype: 'credit card',
        name: 'Credit Card',
        mask: '1234',
        balances: {
          available: 1800,
          current: 200,
          limit: 2000,
          iso_currency_code: 'USD',
        },
      },
    ];

    const liabilities: PlaidLiability[] = [
      {
        account_id: 'credit_1',
        type: 'credit',
        minimum_payment_amount: 25,
        last_payment_amount: 200,
        aprs: [],
      },
    ];

    const result = detectCredit(accounts, liabilities, '30d');

    expect(result.detected).toBe(false);
    expect(result.evidence.accounts[0].utilizationBucket).toBe('under_30');
    expect(result.evidence.accounts[0].utilizationPercent).toBe(10);
  });
});
