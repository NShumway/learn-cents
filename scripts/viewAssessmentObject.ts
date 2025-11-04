#!/usr/bin/env tsx

/**
 * View Assessment Object
 *
 * Displays the complete assessment object structure after signal detection
 * and persona assignment. This IS the base assessment.
 *
 * Usage:
 *   npm run view:assessment [user_index]
 *
 * Examples:
 *   npm run view:assessment         # View first user
 *   npm run view:assessment 5       # View user at index 5
 */

import * as fs from 'fs/promises';
import { SyntheticDataset, UserFinancialData } from '../src/types/plaid';
import { detectAllSignals } from '../src/signals';
import { assignPersona } from '../src/personas';

async function main() {
  console.log('📋 Assessment Object Structure\n');

  // Load synthetic data
  const dataPath = './data/synthetic-users.json';
  const rawData = await fs.readFile(dataPath, 'utf-8');
  const dataset: SyntheticDataset = JSON.parse(rawData);

  // Get user index
  const args = process.argv.slice(2);
  const userIndex = parseInt(args[0] || '0', 10);

  if (isNaN(userIndex) || userIndex < 0 || userIndex >= dataset.users.length) {
    console.error(`❌ Invalid user index: ${args[0]}`);
    console.error(`   Valid range: 0-${dataset.users.length - 1}`);
    process.exit(1);
  }

  const user = dataset.users[userIndex];
  console.log(`👤 User ${userIndex}: ${user.name.first} ${user.name.last}`);
  console.log(`   Accounts: ${user.accounts.length}`);
  console.log(`   Transactions: ${user.transactions.length}`);
  console.log(`   Liabilities: ${user.liabilities.length}\n`);

  const userData: UserFinancialData = {
    accounts: user.accounts,
    transactions: user.transactions,
    liabilities: user.liabilities,
  };

  // Generate the assessment object
  console.log('🔄 Generating assessment...\n');
  const signals = detectAllSignals(userData);
  const personaResult = assignPersona(signals);

  // This is the complete assessment object
  const assessmentObject = {
    userId: user.user_id,
    userName: `${user.name.first} ${user.name.last}`,
    generatedAt: new Date().toISOString(),

    // Signal detection results
    signals,

    // Persona assignment result
    persona: personaResult,
  };

  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('COMPLETE ASSESSMENT OBJECT');
  console.log('════════════════════════════════════════════════════════════════════════════════\n');
  console.log(JSON.stringify(assessmentObject, null, 2));

  // Also save to file
  const outputPath = `./data/assessment-user-${userIndex}.json`;
  await fs.writeFile(outputPath, JSON.stringify(assessmentObject, null, 2));
  console.log(`\n\n✅ Assessment object saved to: ${outputPath}\n`);

  // Print summary
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  console.log(`\nPrimary Persona: ${personaResult.personas[0].persona}`);
  if (personaResult.personas.length > 1) {
    console.log(`Additional Personas: ${personaResult.personas.slice(1).map(p => p.persona).join(', ')}`);
  }
  console.log(`\nSignals Detected:`);
  for (const signal of personaResult.decisionTree.signalsDetected) {
    console.log(`  ✓ ${signal}`);
  }
  console.log(`\nObject Size: ${JSON.stringify(assessmentObject).length.toLocaleString()} bytes`);
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
