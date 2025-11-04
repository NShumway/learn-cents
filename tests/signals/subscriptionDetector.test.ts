/**
 * Tests for Subscription Detector
 */

import { describe, it, expect } from 'vitest';
import { detectSubscriptions } from '../../src/signals/subscriptionDetector';
import { PlaidTransaction } from '../../src/types/plaid';

describe('Subscription Detector', () => {
  it('should detect monthly subscription', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [
      {
        transaction_id: 'tx_1',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 9.99,
        merchant_name: 'Netflix',
        merchant_entity_id: 'merchant_netflix',
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'ENTERTAINMENT',
          detailed: 'ENTERTAINMENT_VIDEO',
        },
        pending: false,
        name: 'Netflix Subscription',
      },
      {
        transaction_id: 'tx_2',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 9.99,
        merchant_name: 'Netflix',
        merchant_entity_id: 'merchant_netflix',
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'ENTERTAINMENT',
          detailed: 'ENTERTAINMENT_VIDEO',
        },
        pending: false,
        name: 'Netflix Subscription',
      },
      {
        transaction_id: 'tx_3',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 9.99,
        merchant_name: 'Netflix',
        merchant_entity_id: 'merchant_netflix',
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'ENTERTAINMENT',
          detailed: 'ENTERTAINMENT_VIDEO',
        },
        pending: false,
        name: 'Netflix Subscription',
      },
    ];

    const result = detectSubscriptions(transactions, '180d');

    expect(result.detected).toBe(true);
    expect(result.evidence.subscriptions).toHaveLength(1);
    expect(result.evidence.subscriptions[0].merchant).toBe('netflix');
    expect(result.evidence.subscriptions[0].cadence).toBe('monthly');
    expect(result.evidence.subscriptions[0].amount).toBe(9.99);
    expect(result.evidence.subscriptions[0].count).toBe(3);
  });

  it('should not detect subscription with less than 3 transactions', () => {
    const transactions: PlaidTransaction[] = [
      {
        transaction_id: 'tx_1',
        account_id: 'acc_1',
        date: '2025-10-15',
        amount: 9.99,
        merchant_name: 'Netflix',
        merchant_entity_id: 'merchant_netflix',
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'ENTERTAINMENT',
          detailed: 'ENTERTAINMENT_VIDEO',
        },
        pending: false,
        name: 'Netflix Subscription',
      },
      {
        transaction_id: 'tx_2',
        account_id: 'acc_1',
        date: '2025-11-15',
        amount: 9.99,
        merchant_name: 'Netflix',
        merchant_entity_id: 'merchant_netflix',
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'ENTERTAINMENT',
          detailed: 'ENTERTAINMENT_VIDEO',
        },
        pending: false,
        name: 'Netflix Subscription',
      },
    ];

    const result = detectSubscriptions(transactions, '180d');

    expect(result.detected).toBe(false);
    expect(result.evidence.subscriptions).toHaveLength(0);
  });

  it('should detect weekly subscription', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [
      {
        transaction_id: 'tx_1',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 5.0,
        merchant_name: 'Weekly Service',
        merchant_entity_id: null,
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'GENERAL_SERVICES',
          detailed: 'GENERAL_SERVICES_OTHER',
        },
        pending: false,
        name: 'Weekly Service Charge',
      },
      {
        transaction_id: 'tx_2',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 5.0,
        merchant_name: 'Weekly Service',
        merchant_entity_id: null,
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'GENERAL_SERVICES',
          detailed: 'GENERAL_SERVICES_OTHER',
        },
        pending: false,
        name: 'Weekly Service Charge',
      },
      {
        transaction_id: 'tx_3',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 5.0,
        merchant_name: 'Weekly Service',
        merchant_entity_id: null,
        payment_channel: 'online',
        personal_finance_category: {
          primary: 'GENERAL_SERVICES',
          detailed: 'GENERAL_SERVICES_OTHER',
        },
        pending: false,
        name: 'Weekly Service Charge',
      },
    ];

    const result = detectSubscriptions(transactions, '30d');

    expect(result.detected).toBe(true);
    expect(result.evidence.subscriptions[0].cadence).toBe('weekly');
  });
});
