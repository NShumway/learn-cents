#!/usr/bin/env tsx

/**
 * Test Persona Assignment
 *
 * This CLI tool tests the persona assignment algorithm with synthetic data.
 * It runs signal detection and persona assignment, then displays the decision tree.
 *
 * Usage:
 *   npm run test:personas [user_index]
 *
 * Examples:
 *   npm run test:personas           # Test first user
 *   npm run test:personas 0         # Test first user
 *   npm run test:personas 5         # Test 6th user
 *   npm run test:personas all       # Test all users
 */

import * as fs from 'fs/promises';
import { SyntheticDataset, UserFinancialData } from '../src/types/plaid';
import { detectAllSignals } from '../src/signals';
import { assignPersona } from '../src/personas';
import { PERSONA_LABELS, PERSONA_DESCRIPTIONS } from '../src/types/persona';

async function main() {
  console.log('🧪 Testing Persona Assignment\n');

  // Load synthetic data
  const dataPath = './data/synthetic-users.json';
  let rawData: string;
  try {
    rawData = await fs.readFile(dataPath, 'utf-8');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Synthetic user data not found at ${dataPath}`);
      console.error(`   Run: npm run generate:data`);
      process.exit(1);
    }
    throw error;
  }
  const dataset: SyntheticDataset = JSON.parse(rawData);

  console.log(`📊 Loaded ${dataset.users.length} synthetic users\n`);

  // Determine which users to test
  const args = process.argv.slice(2);
  const testMode = args[0] || '0';

  if (testMode === 'all') {
    // Test all users
    console.log('Testing all users...\n');
    console.log('═'.repeat(80));

    const personaCounts: Record<string, number> = {};

    for (let i = 0; i < dataset.users.length; i++) {
      const user = dataset.users[i];
      const userData: UserFinancialData = {
        accounts: user.accounts,
        transactions: user.transactions,
        liabilities: user.liabilities,
      };

      const signals = detectAllSignals(userData);
      const result = assignPersona(signals);

      personaCounts[result.personas[0].persona] = (personaCounts[result.personas[0].persona] || 0) + 1;

      console.log(
        `User ${i + 1}/${dataset.users.length}: ${user.name.first} ${user.name.last} → ${PERSONA_LABELS[result.personas[0].persona]}`
      );
    }

    console.log('\n═'.repeat(80));
    console.log('\n📈 Persona Distribution:\n');

    const sortedPersonas = Object.entries(personaCounts).sort((a, b) => b[1] - a[1]);
    for (const [persona, count] of sortedPersonas) {
      const percentage = ((count / dataset.users.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor((count / dataset.users.length) * 50));
      console.log(`  ${PERSONA_LABELS[persona as keyof typeof PERSONA_LABELS].padEnd(25)} ${count.toString().padStart(3)} (${percentage.padStart(5)}%) ${bar}`);
    }
  } else {
    // Test single user
    const userIndex = parseInt(testMode, 10);

    if (isNaN(userIndex) || userIndex < 0 || userIndex >= dataset.users.length) {
      console.error(`❌ Invalid user index: ${testMode}`);
      console.error(`   Valid range: 0-${dataset.users.length - 1}`);
      process.exit(1);
    }

    const user = dataset.users[userIndex];
    console.log(`👤 Testing User ${userIndex}: ${user.name.first} ${user.name.last}`);
    console.log(`   Accounts: ${user.accounts.length}`);
    console.log(`   Transactions: ${user.transactions.length}`);
    console.log(`   Liabilities: ${user.liabilities.length}\n`);

    const userData: UserFinancialData = {
      accounts: user.accounts,
      transactions: user.transactions,
      liabilities: user.liabilities,
    };

    // Run signal detection
    console.log('🔍 Detecting Signals...\n');
    const signals = detectAllSignals(userData);

    // Display detected signals
    console.log('Detected Signals:');
    if (signals.overdrafts['30d'].detected || signals.overdrafts['180d'].detected) {
      console.log('  ✓ Overdrafts detected');
    }
    if (signals.credit['30d'].detected) {
      console.log('  ✓ Credit activity detected');
    }
    if (signals.income['180d'].detected) {
      console.log('  ✓ Income detected');
    }
    if (signals.subscriptions['30d'].detected) {
      console.log('  ✓ Subscriptions detected');
    }
    if (signals.savings['180d'].detected) {
      console.log('  ✓ Savings activity detected');
    }
    if (signals.bankingActivity['180d'].detected) {
      console.log('  ✓ Banking activity detected');
    }

    // Run persona assignment
    console.log('\n🎯 Assigning Persona...\n');
    const result = assignPersona(signals);

    // Display personas (primary at [0])
    console.log('═'.repeat(80));
    console.log('ASSIGNED PERSONAS');
    console.log('═'.repeat(80));

    for (let i = 0; i < result.personas.length; i++) {
      const p = result.personas[i];
      const isPrimary = i === 0;

      console.log(`\n${isPrimary ? '📌' : '○'} ${PERSONA_LABELS[p.persona]}${isPrimary ? ' (PRIMARY)' : ''}`);
      console.log(`   ${PERSONA_DESCRIPTIONS[p.persona]}`);

      console.log(`\n   Reasoning:`);
      for (const reason of p.reasoning) {
        console.log(`     • ${reason}`);
      }

      if (Object.keys(p.evidence).length > 0) {
        console.log(`\n   Evidence:`);
        console.log(`     ${JSON.stringify(p.evidence, null, 2).split('\n').join('\n     ')}`);
      }
    }

    // Display decision tree
    console.log('\n═'.repeat(80));
    console.log('DECISION TREE');
    console.log('═'.repeat(80));

    console.log(`\n🔍 Signals Detected: ${result.decisionTree.signalsDetected.join(', ') || 'none'}`);
    console.log(`\n📊 Personas Evaluated:\n`);

    for (let i = 0; i < result.decisionTree.personasEvaluated.length; i++) {
      const node = result.decisionTree.personasEvaluated[i];
      const isPrimary = node.persona === result.decisionTree.primaryPersona;
      const priorityLabel = `Priority ${i + 1}`;

      if (node.matched) {
        console.log(`  ${isPrimary ? '✓' : '○'} ${priorityLabel}: ${PERSONA_LABELS[node.persona]} ${isPrimary ? '← PRIMARY' : ''}`);
        console.log(`     Matched: YES`);
        for (const criterion of node.criteria) {
          console.log(`       • ${criterion}`);
        }
      } else {
        console.log(`  ✗ ${priorityLabel}: ${PERSONA_LABELS[node.persona]}`);
        console.log(`     Matched: NO`);
        if (node.criteria.length > 0) {
          console.log(`       • ${node.criteria[0]}`);
        }
      }
      console.log('');
    }

    console.log(`💡 ${result.decisionTree.reasoning}\n`);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
