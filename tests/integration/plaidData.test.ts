/**
 * Integration Tests for Plaid Data
 *
 * Tests the full assessment pipeline (signal detection + persona assignment)
 * using real Plaid API response structures from the sandbox environment.
 *
 * Uses committed sample data (plaid-sandbox-sample.json) to ensure tests
 * are deterministic and don't require live API calls.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import { detectAllSignals } from '../../src/signals';
import { assignPersona } from '../../src/personas';
import { UserFinancialData } from '../../src/types/plaid';

describe('Plaid Data Integration', () => {
  it('should process real Plaid sandbox data without errors', async () => {
    // Load the committed Plaid sample data
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    // Extract user financial data from Plaid structure
    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    // Should not throw
    expect(() => detectAllSignals(userData)).not.toThrow();
  });

  it('should detect signals from Plaid sandbox data', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    const signals = detectAllSignals(userData);

    // Should return a valid signals object
    expect(signals).toBeDefined();
    expect(signals).toHaveProperty('overdrafts');
    expect(signals).toHaveProperty('credit');
    expect(signals).toHaveProperty('income');
    expect(signals).toHaveProperty('savings');
    expect(signals).toHaveProperty('subscriptions');
    expect(signals).toHaveProperty('bankingActivity');
  });

  it('should assign persona from Plaid sandbox data', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    const signals = detectAllSignals(userData);
    const personaResult = assignPersona(signals);

    // Should return a valid persona result
    expect(personaResult).toBeDefined();
    expect(personaResult).toHaveProperty('personas');
    expect(personaResult).toHaveProperty('decisionTree');
    expect(Array.isArray(personaResult.personas)).toBe(true);
    expect(personaResult.personas.length).toBeGreaterThan(0);
  });

  it('should generate complete assessment object from Plaid data', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    const signals = detectAllSignals(userData);
    const personaResult = assignPersona(signals);

    // Build the complete assessment object (matches what run:assessment generates)
    const assessmentObject = {
      userId: 'plaid-sandbox-user',
      userName: 'Plaid Sandbox User',
      dataSource: 'plaid',
      generatedAt: new Date().toISOString(),
      signals,
      persona: personaResult,
    };

    // Verify assessment object structure
    expect(assessmentObject.userId).toBe('plaid-sandbox-user');
    expect(assessmentObject.dataSource).toBe('plaid');
    expect(assessmentObject.signals).toBeDefined();
    expect(assessmentObject.persona).toBeDefined();
    expect(assessmentObject.persona.personas[0]).toHaveProperty('persona');
    expect(assessmentObject.persona.personas[0]).toHaveProperty('reasoning');
    expect(assessmentObject.persona.personas[0]).toHaveProperty('evidence');
  });

  it('should handle Plaid data with credit accounts correctly', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    const signals = detectAllSignals(userData);

    // The sample data has credit cards, so credit signal should be detected
    const creditAccounts = plaidData.accounts.filter(
      (acc: { type: string }) => acc.type === 'credit'
    );
    if (creditAccounts.length > 0) {
      expect(signals.credit['30d'].detected).toBeDefined();
    }
  });

  it('should handle Plaid data with no transactions gracefully', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    const userData: UserFinancialData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };

    // Sample data has no transactions according to the metadata
    expect(userData.transactions.length).toBe(0);

    // Should still complete without errors
    const signals = detectAllSignals(userData);
    const personaResult = assignPersona(signals);

    expect(signals).toBeDefined();
    expect(personaResult).toBeDefined();
    expect(personaResult.personas.length).toBeGreaterThan(0);
  });

  it('should detect various account types from Plaid data', async () => {
    const rawData = await fs.readFile('./tests/fixtures/plaid-sandbox-sample.json', 'utf-8');
    const plaidData = JSON.parse(rawData);

    // Verify the sample data has various account types
    const accountTypes = new Set(plaidData.accounts.map((acc: { type: string }) => acc.type));

    expect(accountTypes.has('depository')).toBe(true);
    expect(accountTypes.has('credit')).toBe(true);
    expect(accountTypes.has('loan')).toBe(true);
    expect(accountTypes.has('investment')).toBe(true);
  });
});
