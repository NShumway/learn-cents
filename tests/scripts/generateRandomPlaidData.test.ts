import { describe, it, expect } from 'vitest';
import { generateSyntheticUsers } from '../../scripts/lib/generators/userGenerator.js';

describe('Synthetic Data Generator', () => {
  it('generates specified number of users', () => {
    const users = generateSyntheticUsers(10);
    expect(users).toHaveLength(10);
  });

  it('each user has required fields', () => {
    const users = generateSyntheticUsers(5);
    users.forEach((user) => {
      expect(user.user_id).toBeDefined();
      expect(user.name.first).toBeDefined();
      expect(user.name.last).toBeDefined();
      expect(user.accounts.length).toBeGreaterThan(0);
      expect(user.transactions.length).toBeGreaterThan(0);
    });
  });

  it('generates valid account structures', () => {
    const users = generateSyntheticUsers(5);
    users.forEach((user) => {
      user.accounts.forEach((account) => {
        expect(account.account_id).toBeDefined();
        expect(account.type).toMatch(/depository|credit|loan/);
        expect(account.balances.current).toBeTypeOf('number');
        expect(account.balances.iso_currency_code).toBe('USD');
      });
    });
  });

  it('generates valid transaction structures', () => {
    const users = generateSyntheticUsers(3);
    users.forEach((user) => {
      user.transactions.forEach((transaction) => {
        expect(transaction.transaction_id).toBeDefined();
        expect(transaction.account_id).toBeDefined();
        expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
        expect(transaction.amount).toBeTypeOf('number');
        expect(transaction.personal_finance_category.primary).toBeDefined();
        expect(transaction.personal_finance_category.detailed).toBeDefined();
      });
    });
  });

  it('generates diverse account types', () => {
    const users = generateSyntheticUsers(20);
    const allAccounts = users.flatMap((u) => u.accounts);

    const accountTypes = new Set(allAccounts.map((a) => a.type));
    expect(accountTypes.size).toBeGreaterThan(1); // Should have multiple account types
  });

  it('generates transactions within expected date range', () => {
    const users = generateSyntheticUsers(5);
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    users.forEach((user) => {
      user.transactions.forEach((transaction) => {
        const txnDate = new Date(transaction.date);
        expect(txnDate.getTime()).toBeGreaterThanOrEqual(sixMonthsAgo.getTime());
        expect(txnDate.getTime()).toBeLessThanOrEqual(now.getTime());
      });
    });
  });

  it('generates liabilities for credit accounts', () => {
    const users = generateSyntheticUsers(10);

    users.forEach((user) => {
      const creditAccounts = user.accounts.filter((a) => a.type === 'credit');
      // If there are credit accounts, some should have liabilities
      if (creditAccounts.length > 0 && user.liabilities.length > 0) {
        user.liabilities.forEach((liability) => {
          expect(liability.account_id).toBeDefined();
          expect(liability.type).toBeDefined();
        });
      }
    });
  });
});
