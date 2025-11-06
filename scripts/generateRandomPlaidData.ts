#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { generateSyntheticUsers } from './lib/generators/userGenerator.js';
import type { SyntheticDataset } from './lib/types/plaidData.js';

interface CLIOptions {
  count: number;
  format: 'json' | 'csv';
  output: string;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  // Show help
  if (args.includes('--help')) {
    console.log(`
Usage: npm run generate:data [options]

Options:
  --count <number>    Number of users to generate (default: 50)
  --format <type>     Output format: json or csv (default: json)
  --output <path>     Output file path (default: ./data/synthetic-users)
  --help              Show this help message

Examples:
  npm run generate:data
  npm run generate:data -- --count 100
  npm run generate:data -- --count 10 --output ~/Documents/test-data
    `);
    process.exit(0);
  }

  const options: CLIOptions = {
    count: 50,
    format: 'json',
    output: './data/synthetic-users',
  };

  // Simple argument parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      options.count = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1] as 'json' | 'csv';
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.output = args[i + 1];
      i++;
    }
  }

  console.log('Generating synthetic Plaid data...');
  console.log(`Count: ${options.count} users`);
  console.log(`Format: ${options.format}`);
  console.log(`Output: ${options.output}`);
  console.log('');

  // Generate users
  const users = generateSyntheticUsers(options.count);

  const dataset: SyntheticDataset = {
    users,
    generated_at: new Date().toISOString(),
    count: users.length,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(options.output);
  await fs.mkdir(outputDir, { recursive: true });

  // Write output
  if (options.format === 'json') {
    const filename = `${options.output}.json`;
    await fs.writeFile(filename, JSON.stringify(dataset, null, 2));
    console.log(`✓ Generated ${users.length} users`);
    console.log(`✓ Saved to ${filename}`);
  } else {
    // CSV format - implement in later story if needed
    throw new Error('CSV format not yet implemented');
  }

  // Print summary statistics
  console.log('');
  console.log('Summary:');
  console.log(`  Total users: ${users.length}`);
  console.log(`  Total accounts: ${users.reduce((sum, u) => sum + u.accounts.length, 0)}`);
  console.log(`  Total transactions: ${users.reduce((sum, u) => sum + u.transactions.length, 0)}`);
  console.log(`  Total liabilities: ${users.reduce((sum, u) => sum + u.liabilities.length, 0)}`);
}

main().catch(console.error);
