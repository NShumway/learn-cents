/**
 * Tests for Data Validator
 */

import { describe, it, expect } from 'vitest';
import { validateData, ValidationError } from '../../src/ingest/dataValidator';
import { UserFinancialData } from '../../src/types/plaid';

describe('Data Validator', () => {
  it('should validate correct data', () => {
    const data: UserFinancialData = {
      accounts: [
        {
          account_id: 'acc_1',
          type: 'depository',
          subtype: 'checking',
          name: 'Checking',
          mask: '1234',
          balances: {
            available: 1000,
            current: 1000,
            limit: null,
            iso_currency_code: 'USD',
          },
        },
      ],
      transactions: [
        {
          transaction_id: 'tx_1',
          account_id: 'acc_1',
          date: '2025-11-01',
          amount: 50,
          merchant_name: 'Store',
          merchant_entity_id: null,
          payment_channel: 'in store',
          personal_finance_category: {
            primary: 'SHOPPING',
            detailed: 'SHOPPING_GENERAL',
          },
          pending: false,
          name: 'Store Purchase',
        },
      ],
      liabilities: [],
    };

    expect(() => validateData(data)).not.toThrow();
  });

  it('should throw error if no accounts', () => {
    const data: UserFinancialData = {
      accounts: [],
      transactions: [],
      liabilities: [],
    };

    expect(() => validateData(data)).toThrow(ValidationError);
    expect(() => validateData(data)).toThrow('No accounts found in data');
  });

  it('should throw error for transaction with invalid account_id', () => {
    const data: UserFinancialData = {
      accounts: [
        {
          account_id: 'acc_1',
          type: 'depository',
          subtype: 'checking',
          name: 'Checking',
          mask: '1234',
          balances: {
            available: 1000,
            current: 1000,
            limit: null,
            iso_currency_code: 'USD',
          },
        },
      ],
      transactions: [
        {
          transaction_id: 'tx_1',
          account_id: 'invalid_account',
          date: '2025-11-01',
          amount: 50,
          merchant_name: 'Store',
          merchant_entity_id: null,
          payment_channel: 'in store',
          personal_finance_category: {
            primary: 'SHOPPING',
            detailed: 'SHOPPING_GENERAL',
          },
          pending: false,
          name: 'Store Purchase',
        },
      ],
      liabilities: [],
    };

    expect(() => validateData(data)).toThrow(ValidationError);
    expect(() => validateData(data)).toThrow('references unknown account');
  });

  it('should throw error for invalid date format', () => {
    const data: UserFinancialData = {
      accounts: [
        {
          account_id: 'acc_1',
          type: 'depository',
          subtype: 'checking',
          name: 'Checking',
          mask: '1234',
          balances: {
            available: 1000,
            current: 1000,
            limit: null,
            iso_currency_code: 'USD',
          },
        },
      ],
      transactions: [
        {
          transaction_id: 'tx_1',
          account_id: 'acc_1',
          date: '11/01/2025',
          amount: 50,
          merchant_name: 'Store',
          merchant_entity_id: null,
          payment_channel: 'in store',
          personal_finance_category: {
            primary: 'SHOPPING',
            detailed: 'SHOPPING_GENERAL',
          },
          pending: false,
          name: 'Store Purchase',
        },
      ],
      liabilities: [],
    };

    expect(() => validateData(data)).toThrow(ValidationError);
    expect(() => validateData(data)).toThrow('Invalid date format');
  });
});
