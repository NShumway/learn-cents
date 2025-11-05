/**
 * Data Validator
 *
 * Validates and normalizes financial data from ingestion
 */

import { UserFinancialData, PlaidAccount, PlaidTransaction } from '../types/plaid';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateData(data: UserFinancialData): void {
  // 1. Structure validation
  if (!Array.isArray(data.accounts)) {
    throw new ValidationError('accounts must be an array');
  }
  if (!Array.isArray(data.transactions)) {
    throw new ValidationError('transactions must be an array');
  }
  if (!Array.isArray(data.liabilities)) {
    throw new ValidationError('liabilities must be an array');
  }

  // 2. Content validation
  if (data.accounts.length === 0) {
    throw new ValidationError('No accounts found in data. At least one account is required.');
  }

  // 3. Validate accounts
  const accountIds = new Set<string>();
  for (const account of data.accounts) {
    validateAccount(account);
    accountIds.add(account.account_id);
  }

  // 4. Validate transactions reference valid accounts
  for (const tx of data.transactions) {
    validateTransaction(tx);
    if (!accountIds.has(tx.account_id)) {
      throw new ValidationError(
        `Transaction ${tx.transaction_id} references unknown account ${tx.account_id}`
      );
    }
  }

  // 5. Validate liabilities reference valid accounts
  for (const liability of data.liabilities) {
    if (!accountIds.has(liability.account_id)) {
      throw new ValidationError(
        `Liability references unknown account ${liability.account_id}`
      );
    }
  }
}

function validateAccount(account: PlaidAccount): void {
  if (!account.account_id) {
    throw new ValidationError('Account missing required field: account_id');
  }
  if (!account.type) {
    throw new ValidationError(`Account ${account.account_id} missing required field: type`);
  }
  if (!account.subtype) {
    throw new ValidationError(`Account ${account.account_id} missing required field: subtype`);
  }
  if (typeof account.balances?.current !== 'number') {
    throw new ValidationError(
      `Account ${account.account_id} missing required field: balances.current`
    );
  }
}

function validateTransaction(tx: PlaidTransaction): void {
  if (!tx.transaction_id) {
    throw new ValidationError('Transaction missing required field: transaction_id');
  }
  if (!tx.account_id) {
    throw new ValidationError(`Transaction ${tx.transaction_id} missing required field: account_id`);
  }
  if (!tx.date) {
    throw new ValidationError(`Transaction ${tx.transaction_id} missing required field: date`);
  }
  if (typeof tx.amount !== 'number') {
    throw new ValidationError(
      `Invalid amount for transaction ${tx.transaction_id}: expected number, got ${typeof tx.amount}`
    );
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(tx.date)) {
    throw new ValidationError(
      `Invalid date format for transaction ${tx.transaction_id}: ${tx.date}. Expected YYYY-MM-DD.`
    );
  }

  // Validate date is parseable
  const parsedDate = new Date(tx.date);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(
      `Invalid date for transaction ${tx.transaction_id}: ${tx.date} cannot be parsed.`
    );
  }
}
