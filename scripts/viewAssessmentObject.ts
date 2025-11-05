#!/usr/bin/env tsx

/**
 * Run Assessment
 *
 * Generates the complete assessment object after signal detection
 * and persona assignment. This IS the base assessment.
 *
 * Usage:
 *   npm run run:assessment [user_index] [--source synthetic|plaid]
 *
 * Examples:
 *   npm run run:assessment                      # Generate assessment for first user (synthetic)
 *   npm run run:assessment 5                    # Generate assessment for user at index 5 (synthetic)
 *   npm run run:assessment -- --source plaid    # Generate assessment from Plaid sandbox data
 *   npm run run:assessment 5 -- --source synthetic
 */

import * as fs from 'fs/promises';
import { SyntheticDataset, UserFinancialData } from '../src/types/plaid';
import { detectAllSignals } from '../src/signals';
import { assignPersona } from '../src/personas';

async function main() {
  console.log('📋 Assessment Object Structure\n');

  // Parse arguments
  const args = process.argv.slice(2);
  let userIndex = 0;
  let source: 'synthetic' | 'plaid' = 'synthetic';

  // Parse flags and user index
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && i + 1 < args.length) {
      const sourceValue = args[i + 1].toLowerCase();
      if (sourceValue === 'synthetic' || sourceValue === 'plaid') {
        source = sourceValue;
      } else {
        console.error(`❌ Invalid source: ${args[i + 1]}`);
        console.error(`   Valid options: synthetic, plaid`);
        process.exit(1);
      }
      i++; // Skip the next arg since it's the value
    } else if (!args[i].startsWith('--')) {
      const parsedIndex = parseInt(args[i], 10);
      if (!isNaN(parsedIndex)) {
        userIndex = parsedIndex;
      }
    }
  }

  console.log(`📊 Data Source: ${source}\n`);

  // Load data based on source
  let userData: UserFinancialData;
  let userId: string;
  let userName: string;

  if (source === 'synthetic') {
    const dataPath = './data/synthetic-users.json';
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const dataset: SyntheticDataset = JSON.parse(rawData);

    if (userIndex < 0 || userIndex >= dataset.users.length) {
      console.error(`❌ Invalid user index: ${userIndex}`);
      console.error(`   Valid range: 0-${dataset.users.length - 1}`);
      process.exit(1);
    }

    const user = dataset.users[userIndex];
    userId = user.user_id;
    userName = `${user.name.first} ${user.name.last}`;

    console.log(`👤 User ${userIndex}: ${userName}`);
    console.log(`   Accounts: ${user.accounts.length}`);
    console.log(`   Transactions: ${user.transactions.length}`);
    console.log(`   Liabilities: ${user.liabilities.length}\n`);

    userData = {
      accounts: user.accounts,
      transactions: user.transactions,
      liabilities: user.liabilities,
    };
  } else {
    // Load Plaid sandbox data
    // Try plaid-user-data.json first (from npm run explore:plaid), fallback to plaid-sandbox-sample.json
    let dataPath = './data/plaid-user-data.json';
    try {
      await fs.access(dataPath);
    } catch {
      dataPath = './data/plaid-sandbox-sample.json';
    }
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const plaidData = JSON.parse(rawData);

    if (userIndex !== 0) {
      console.warn(`⚠️  Plaid sandbox data contains only one user. Ignoring index ${userIndex}, using index 0.\n`);
    }

    userId = plaidData.item_id || 'plaid-sandbox-user';
    userName = 'Plaid Sandbox User';

    console.log(`👤 ${userName}`);
    console.log(`   Accounts: ${plaidData.accounts?.length || 0}`);
    console.log(`   Transactions: ${plaidData.transactions?.length || 0}`);
    console.log(`   Liabilities: ${plaidData.liabilities?.liabilities?.length || 0}\n`);

    userData = {
      accounts: plaidData.accounts || [],
      transactions: plaidData.transactions || [],
      liabilities: plaidData.liabilities?.liabilities || [],
    };
  }

  // Generate the assessment object
  console.log('🔄 Generating assessment...\n');
  const signals = detectAllSignals(userData);
  const personaResult = assignPersona(signals);

  // This is the complete assessment object
  const assessmentObject = {
    userId,
    userName,
    dataSource: source,
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
  const outputPath = source === 'synthetic'
    ? `./data/assessment-user-${userIndex}.json`
    : `./data/assessment-plaid.json`;
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
