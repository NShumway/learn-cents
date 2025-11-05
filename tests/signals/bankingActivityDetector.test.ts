/**
 * Tests for Banking Activity Detector
 */

import { describe, it, expect } from 'vitest';
import { detectBankingActivity } from '../../src/signals/bankingActivityDetector';
import { PlaidTransaction } from '../../src/types/plaid';

describe('Banking Activity Detector', () => {
  it('should detect low-use pattern', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [
      // Only 8 outbound payments in 180d, 2 in 30d, 2 unique merchants
      {
        transaction_id: 'tx_1',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1500, // Outbound payment
        merchant_name: 'Rent Payment',
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'RENT_AND_UTILITIES',
          detailed: 'RENT_AND_UTILITIES_RENT',
        },
        pending: false,
        name: 'Rent',
      },
      {
        transaction_id: 'tx_2',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 50,
        merchant_name: 'Grocery Store',
        merchant_entity_id: null,
        payment_channel: 'in store',
        personal_finance_category: {
          primary: 'FOOD_AND_DRINK',
          detailed: 'FOOD_AND_DRINK_GROCERIES',
        },
        pending: false,
        name: 'Groceries',
      },
      {
        transaction_id: 'tx_3',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1500,
        merchant_name: 'Rent Payment',
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'RENT_AND_UTILITIES',
          detailed: 'RENT_AND_UTILITIES_RENT',
        },
        pending: false,
        name: 'Rent',
      },
      // Add income deposits (should be ignored)
      {
        transaction_id: 'tx_income_1',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: -2500, // Income (negative = credit)
        merchant_name: 'Employer',
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'INCOME',
          detailed: 'INCOME_PAYROLL',
        },
        pending: false,
        name: 'Payroll Deposit',
      },
      {
        transaction_id: 'tx_income_2',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: -2500,
        merchant_name: 'Employer',
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'INCOME',
          detailed: 'INCOME_PAYROLL',
        },
        pending: false,
        name: 'Payroll Deposit',
      },
      // Recent transactions (30d) - only 2 outbound
      {
        transaction_id: 'tx_4',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 1500,
        merchant_name: 'Rent Payment',
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'RENT_AND_UTILITIES',
          detailed: 'RENT_AND_UTILITIES_RENT',
        },
        pending: false,
        name: 'Rent',
      },
      {
        transaction_id: 'tx_5',
        account_id: 'acc_1',
        date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 40,
        merchant_name: 'Grocery Store',
        merchant_entity_id: null,
        payment_channel: 'in store',
        personal_finance_category: {
          primary: 'FOOD_AND_DRINK',
          detailed: 'FOOD_AND_DRINK_GROCERIES',
        },
        pending: false,
        name: 'Groceries',
      },
    ];

    const result = detectBankingActivity(transactions, '180d');

    expect(result.detected).toBe(true);
    expect(result.evidence.outboundPaymentCount180d).toBe(5);
    expect(result.evidence.outboundPaymentCount30d).toBe(2);
    expect(result.evidence.uniquePaymentMerchants).toBe(2);
  });

  it('should NOT detect low-use if recent activity is high', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [];

    // 8 total outbound payments, but 5 in last 30 days
    for (let i = 0; i < 5; i++) {
      transactions.push({
        transaction_id: `tx_recent_${i}`,
        account_id: 'acc_1',
        date: new Date(today.getTime() - (i + 1) * 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: 20,
        merchant_name: `Store ${i}`,
        merchant_entity_id: null,
        payment_channel: 'in store',
        personal_finance_category: {
          primary: 'SHOPPING',
          detailed: 'SHOPPING_GENERAL',
        },
        pending: false,
        name: `Purchase ${i}`,
      });
    }

    // 3 older payments
    for (let i = 0; i < 3; i++) {
      transactions.push({
        transaction_id: `tx_old_${i}`,
        account_id: 'acc_1',
        date: new Date(today.getTime() - (60 + i * 10) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: 20,
        merchant_name: `Store ${i}`,
        merchant_entity_id: null,
        payment_channel: 'in store',
        personal_finance_category: {
          primary: 'SHOPPING',
          detailed: 'SHOPPING_GENERAL',
        },
        pending: false,
        name: `Purchase ${i}`,
      });
    }

    const result = detectBankingActivity(transactions, '180d');

    expect(result.detected).toBe(false); // Recent activity exemption
    expect(result.evidence.outboundPaymentCount30d).toBe(5);
  });

  it('should NOT detect low-use if merchant diversity is high', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [];

    // 8 payments across 6 different merchants
    for (let i = 0; i < 8; i++) {
      transactions.push({
        transaction_id: `tx_${i}`,
        account_id: 'acc_1',
        date: new Date(today.getTime() - (i + 1) * 20 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: 20,
        merchant_name: `Merchant ${i % 6}`, // 6 unique merchants
        merchant_entity_id: null,
        payment_channel: 'in store',
        personal_finance_category: {
          primary: 'SHOPPING',
          detailed: 'SHOPPING_GENERAL',
        },
        pending: false,
        name: `Purchase ${i}`,
      });
    }

    const result = detectBankingActivity(transactions, '180d');

    expect(result.detected).toBe(false); // Diversity exemption
    expect(result.evidence.uniquePaymentMerchants).toBe(6);
  });

  it('should NOT detect low-use if payment count is above threshold', () => {
    const today = new Date();
    const transactions: PlaidTransaction[] = [];

    // 12 payments (above 10 threshold), 2 merchants, 3 in last 30d
    for (let i = 0; i < 12; i++) {
      transactions.push({
        transaction_id: `tx_${i}`,
        account_id: 'acc_1',
        date: new Date(today.getTime() - (i + 1) * 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        amount: 50,
        merchant_name: i % 2 === 0 ? 'Rent' : 'Groceries', // 2 merchants
        merchant_entity_id: null,
        payment_channel: 'other',
        personal_finance_category: {
          primary: 'SHOPPING',
          detailed: 'SHOPPING_GENERAL',
        },
        pending: false,
        name: `Payment ${i}`,
      });
    }

    const result = detectBankingActivity(transactions, '180d');

    expect(result.detected).toBe(false); // Above transaction threshold
    expect(result.evidence.outboundPaymentCount180d).toBe(12);
  });
});
