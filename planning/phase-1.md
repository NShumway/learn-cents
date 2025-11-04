# Phase 1: Foundation

**Stories 1-3** - Establishes project structure, synthetic data generation, and database/auth setup.

---

## Story 1: Project Setup & Infrastructure

### Goals
- Initialize Node.js/TypeScript project with proper configuration
- Create modular folder structure aligned with system architecture
- Set up environment configuration with proper security (.env management)
- Create README with setup instructions skeleton
- Configure CI/CD pipeline (GitHub Actions → Vercel)
- Create setup script for dependency installation and validation

### File Structure

```
learn-cents/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD workflow
├── ingest/                      # Data loading and validation
├── features/                    # Signal detection and feature engineering
├── personas/                    # Persona assignment logic
├── recommend/                   # Recommendation engine
├── guardrails/                  # Consent, eligibility, tone checks
├── ui/                         # Operator view and user experience
├── eval/                       # Evaluation harness
├── docs/                       # Decision log and schema documentation
├── scripts/                    # CLI tools (TypeScript scripts)
├── tests/                      # Test files
├── planning/                   # PRD and phase docs (already exists)
├── .claude/                    # Claude Code config (already exists)
├── .env.example                # Example environment variables
├── .env                        # Actual environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── setup.bat                   # Setup script (Windows)
├── setup.sh                    # Setup script (Unix/Mac)
└── README.md                   # Project documentation
```

### Implementation Details

#### 1. Initialize Project

```bash
# Run these commands:
npm init -y
npm install typescript @types/node tsx vitest --save-dev
npm install dotenv
npx tsc --init
```

#### 2. package.json Configuration

```json
{
  "name": "learn-cents",
  "version": "0.1.0",
  "description": "Financial education platform with behavioral insights",
  "type": "module",
  "scripts": {
    "dev": "tsx watch ui/app/main.ts",
    "build": "tsc && vite build",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["fintech", "education", "plaid"],
  "author": "",
  "license": "MIT"
}
```

#### 3. tsconfig.json Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "paths": {
      "@/ingest/*": ["./ingest/*"],
      "@/features/*": ["./features/*"],
      "@/personas/*": ["./personas/*"],
      "@/recommend/*": ["./recommend/*"],
      "@/guardrails/*": ["./guardrails/*"],
      "@/ui/*": ["./ui/*"],
      "@/eval/*": ["./eval/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

#### 4. .env.example

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url

# Plaid Configuration (Sandbox)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox

# Application
NODE_ENV=development
```

#### 5. .env (created but gitignored)

```bash
# Copy from .env.example
# Actual keys will be added by developer
```

#### 6. Update .gitignore

```
# Environment
.env
.env.local

# Dependencies
node_modules/

# Build outputs
dist/
build/
.vercel/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Temporary files
*.tmp
```

#### 7. setup.bat (Windows)

```batch
@echo off
echo ====================================
echo Learning Cents - Project Setup
echo ====================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit .env file and add your API keys:
    echo   - OPENAI_API_KEY
    echo   - SUPABASE_URL
    echo   - SUPABASE_ANON_KEY
    echo   - DATABASE_URL
    echo   - PLAID_CLIENT_ID
    echo   - PLAID_SECRET
    echo.
    pause
) else (
    echo .env file already exists.
)

echo Installing dependencies...
call npm install

REM Validate environment variables (to be expanded in Story 19)
echo.
echo Validating environment configuration...
node -e "require('dotenv').config(); const missing = []; ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_ANON_KEY','DATABASE_URL'].forEach(key => { if (!process.env[key]) missing.push(key); }); if (missing.length > 0) { console.log('Missing required environment variables:', missing.join(', ')); process.exit(1); } else { console.log('Environment configuration valid!'); }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Missing required environment variables.
    echo Please update your .env file with the required keys.
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup complete!
echo ====================================
echo.
echo Next steps:
echo   1. Run 'npm run dev' to start development server
echo   2. Run 'npm test' to run tests
echo.
```

#### 8. setup.sh (Unix/Mac)

```bash
#!/bin/bash

echo "===================================="
echo "Learning Cents - Project Setup"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "IMPORTANT: Please edit .env file and add your API keys:"
    echo "  - OPENAI_API_KEY"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - DATABASE_URL"
    echo "  - PLAID_CLIENT_ID"
    echo "  - PLAID_SECRET"
    echo ""
    read -p "Press enter to continue..."
else
    echo ".env file already exists."
fi

echo "Installing dependencies..."
npm install

# Validate environment variables
echo ""
echo "Validating environment configuration..."
node -e "require('dotenv').config(); const missing = []; ['OPENAI_API_KEY','SUPABASE_URL','SUPABASE_ANON_KEY','DATABASE_URL'].forEach(key => { if (!process.env[key]) missing.push(key); }); if (missing.length > 0) { console.log('Missing required environment variables:', missing.join(', ')); process.exit(1); } else { console.log('Environment configuration valid!'); }"

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Missing required environment variables."
    echo "Please update your .env file with the required keys."
    exit 1
fi

echo ""
echo "===================================="
echo "Setup complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start development server"
echo "  2. Run 'npm test' to run tests"
echo ""
```

#### 9. README.md (Skeleton)

```markdown
# Learning Cents

Financial education platform that transforms transaction data into personalized behavioral insights.

## Overview

Learning Cents analyzes financial transaction data (via Plaid integration) to:
- Detect behavioral patterns (subscriptions, savings, credit, income, overdrafts)
- Assign users to financial personas (7 types)
- Generate personalized educational insights
- Provide relevant partner offers

## Key Features

### Decision Flow
1. **Data Import**: User connects Plaid account (OAuth)
2. **Client-Side Processing**: Browser processes transaction data locally (<1s)
3. **Signal Detection**: Identifies behavioral patterns (30-day & 180-day windows)
4. **Persona Assignment**: Assigns to 1-7 personas based on detected signals
5. **Assessment Generation**: Creates priority insight + additional insights
6. **AI Chat**: Follow-up questions with guardrails (tone, legal, eligibility)

### 7 Financial Personas
1. **High Utilization** - Credit card utilization ≥50% or paying interest
2. **Frequent Overdrafts** - Negative balances, NSF fees detected
3. **Variable Income Budgeter** - Irregular income, low cash buffer
4. **Subscription-Heavy** - ≥3 recurring charges, high subscription spend
5. **Savings Builder** - Positive savings growth, low credit utilization
6. **Blank Slate** - Minimal transaction history (<30 transactions/180d)
7. **General** - Catch-all for users not matching specific personas

## Setup

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Supabase account
- Plaid account (sandbox for development)

### Installation

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Create `.env` file from `.env.example`
2. Install dependencies
3. Validate environment configuration

### Environment Variables

Edit `.env` and add your API keys:
- `OPENAI_API_KEY` - OpenAI API key for AI chat
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - Supabase database connection string
- `PLAID_CLIENT_ID` - Plaid client ID (sandbox)
- `PLAID_SECRET` - Plaid secret key (sandbox)

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format
```

## Project Structure

```
ingest/       - Data loading and validation
features/     - Signal detection and feature engineering
personas/     - Persona assignment logic
recommend/    - Recommendation engine
guardrails/   - Consent, eligibility, tone checks
ui/           - Operator view and user experience
eval/         - Evaluation harness
docs/         - Decision log and schema documentation
scripts/      - CLI tools
tests/        - Test files
planning/     - PRD and development phases
```

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel serverless functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4 via Vercel AI SDK
- **Data Source**: Plaid API (OAuth integration)

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.ts

# Run with coverage
npm test -- --coverage
```

## Deployment

Automatic deployment via GitHub Actions:
- Push to `main` branch → Deploy to Vercel production
- Pull requests → Deploy preview environment

## Documentation

- [PRD](./planning/PRD.md) - Product Requirements Document
- [Development Phases](./planning/phases.md) - Development roadmap
- [Setup Guide](./docs/SETUP.md) - Detailed setup instructions (TODO)

## License

MIT

---

**Note**: This is educational software, not financial advice. All recommendations include appropriate disclaimers.
```

#### 10. GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm test -- --run

      - name: Run lint
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

#### 11. Create Empty Module Folders

Create empty `.gitkeep` files in each module folder to ensure they're tracked:

```bash
# Create folders with .gitkeep
mkdir -p ingest features personas recommend guardrails ui eval docs scripts tests
touch ingest/.gitkeep features/.gitkeep personas/.gitkeep recommend/.gitkeep guardrails/.gitkeep ui/.gitkeep eval/.gitkeep docs/.gitkeep scripts/.gitkeep tests/.gitkeep
```

### Acceptance Criteria

- [ ] Project initializes with `npm install`
- [ ] TypeScript compiles without errors
- [ ] `setup.bat` / `setup.sh` runs successfully
- [ ] `.env` file created from `.env.example`
- [ ] `.gitignore` properly configured (`.env` not committed)
- [ ] All module folders exist with proper structure
- [ ] README.md renders correctly with setup instructions
- [ ] GitHub Actions workflow file created
- [ ] Can run `npm test` (even if no tests yet)
- [ ] Path aliases work in TypeScript (`@/ingest/*`, etc.)

### Testing

- Manual: Run setup script, verify output
- Manual: Check all files created correctly
- Manual: Verify README renders on GitHub
- CI: Will run on first commit to verify workflow

---

## Story 2: Synthetic Data Generator (CLI)

### Goals
- Create TypeScript CLI tool to generate realistic synthetic financial data
- Output Plaid-compatible JSON/CSV format
- Support 50-100 diverse user profiles
- Include accounts, transactions, liabilities data
- No real PII - use fake names, masked account numbers

### File Structure

```
scripts/
├── generateRandomPlaidData.ts    # Main CLI script
└── lib/
    ├── generators/
    │   ├── accountGenerator.ts   # Generate account data
    │   ├── transactionGenerator.ts  # Generate transactions
    │   └── liabilityGenerator.ts    # Generate liabilities
    ├── types/
    │   └── plaidData.ts          # TypeScript types for Plaid data
    └── utils/
        ├── faker.ts              # Fake data generation helpers
        └── dateUtils.ts          # Date manipulation utilities
tests/
└── scripts/
    └── generateRandomPlaidData.test.ts
```

### Implementation Details

#### 1. Plaid Data Types (scripts/lib/types/plaidData.ts)

```typescript
// Based on Plaid API structure
export interface PlaidAccount {
  account_id: string;
  type: 'depository' | 'credit' | 'loan';
  subtype: 'checking' | 'savings' | 'credit card' | 'money market' | 'hsa' | 'student' | 'mortgage';
  balances: {
    available: number | null;
    current: number;
    limit: number | null;
    iso_currency_code: string;
  };
  holder_category: 'personal' | 'business';
  name: string;
  mask: string; // Last 4 digits
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  merchant_name: string | null;
  merchant_entity_id: string | null;
  payment_channel: 'online' | 'in store' | 'other';
  personal_finance_category: {
    primary: string;
    detailed: string;
  };
  pending: boolean;
  name: string; // Transaction description
}

export interface PlaidLiability {
  account_id: string;
  type: 'credit' | 'student' | 'mortgage';
  // Credit card specific
  aprs?: Array<{
    apr_type: string;
    apr_percentage: number;
  }>;
  minimum_payment_amount?: number;
  last_payment_amount?: number;
  is_overdue?: boolean;
  next_payment_due_date?: string;
  last_statement_balance?: number;
  // Loan specific
  interest_rate?: number;
}

export interface PlaidUser {
  user_id: string;
  name: {
    first: string;
    last: string;
  };
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

export interface SyntheticDataset {
  users: PlaidUser[];
  generated_at: string;
  count: number;
}
```

#### 2. Main CLI Script (scripts/generateRandomPlaidData.ts)

```typescript
#!/usr/bin/env tsx

import fs from 'fs/promises';
import path from 'path';
import { generateSyntheticUsers } from './lib/generators/userGenerator';
import type { SyntheticDataset } from './lib/types/plaidData';

interface CLIOptions {
  count: number;
  format: 'json' | 'csv';
  output: string;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    count: 50,
    format: 'json',
    output: './data/synthetic-users'
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
    count: users.length
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
```

#### 3. User Generator (scripts/lib/generators/userGenerator.ts)

```typescript
import { generateAccounts } from './accountGenerator';
import { generateTransactions } from './transactionGenerator';
import { generateLiabilities } from './liabilityGenerator';
import { randomId, randomName } from '../utils/faker';
import type { PlaidUser } from '../types/plaidData';

export function generateSyntheticUsers(count: number): PlaidUser[] {
  const users: PlaidUser[] = [];

  for (let i = 0; i < count; i++) {
    const userId = randomId('user');
    const name = randomName();

    // Generate 1-5 accounts per user
    const accounts = generateAccounts(userId, Math.floor(Math.random() * 5) + 1);

    // Generate 100-2000 transactions per user (spread over 180 days)
    const transactionCount = Math.floor(Math.random() * 1900) + 100;
    const transactions = generateTransactions(accounts, transactionCount, 180);

    // Generate 0-3 liabilities (not all users have debt)
    const liabilityCount = Math.random() > 0.3 ? Math.floor(Math.random() * 3) : 0;
    const liabilities = generateLiabilities(accounts, liabilityCount);

    users.push({
      user_id: userId,
      name,
      accounts,
      transactions,
      liabilities
    });
  }

  return users;
}
```

#### 4. Account Generator Stub (scripts/lib/generators/accountGenerator.ts)

```typescript
import type { PlaidAccount } from '../types/plaidData';
import { randomId } from '../utils/faker';

export function generateAccounts(userId: string, count: number): PlaidAccount[] {
  const accounts: PlaidAccount[] = [];

  // Ensure at least one checking account
  accounts.push(generateCheckingAccount(userId));

  // Add additional random accounts
  for (let i = 1; i < count; i++) {
    const rand = Math.random();
    if (rand < 0.3) {
      accounts.push(generateSavingsAccount(userId));
    } else if (rand < 0.6) {
      accounts.push(generateCreditCard(userId));
    } else {
      accounts.push(generateCheckingAccount(userId));
    }
  }

  return accounts;
}

function generateCheckingAccount(userId: string): PlaidAccount {
  const balance = Math.random() * 5000 + 500; // $500 - $5500

  return {
    account_id: randomId('acc'),
    type: 'depository',
    subtype: 'checking',
    balances: {
      available: balance,
      current: balance,
      limit: null,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Checking Account',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

function generateSavingsAccount(userId: string): PlaidAccount {
  const balance = Math.random() * 10000 + 1000; // $1000 - $11000

  return {
    account_id: randomId('acc'),
    type: 'depository',
    subtype: 'savings',
    balances: {
      available: balance,
      current: balance,
      limit: null,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Savings Account',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

function generateCreditCard(userId: string): PlaidAccount {
  const limit = Math.random() * 20000 + 1000; // $1000 - $21000 limit
  const utilization = Math.random(); // 0-100% utilization
  const balance = limit * utilization;

  return {
    account_id: randomId('acc'),
    type: 'credit',
    subtype: 'credit card',
    balances: {
      available: limit - balance,
      current: balance,
      limit: limit,
      iso_currency_code: 'USD'
    },
    holder_category: 'personal',
    name: 'Credit Card',
    mask: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  };
}

// TODO: Implement other account types (money market, HSA, etc.)
```

#### 5. Faker Utilities (scripts/lib/utils/faker.ts)

```typescript
const FIRST_NAMES = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Jessica', 'Robert', 'Lisa'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

export function randomName(): { first: string; last: string } {
  return {
    first: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    last: LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  };
}

export function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 15)}`;
}

export function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// TODO: Add more faker utilities as needed
```

#### 6. Add Script to package.json

```json
{
  "scripts": {
    "generate:data": "tsx scripts/generateRandomPlaidData.ts"
  }
}
```

### Acceptance Criteria

- [ ] CLI script generates 50-100 synthetic users
- [ ] Output is valid JSON matching Plaid schema
- [ ] Users have diverse financial situations:
  - [ ] Different account types (checking, savings, credit cards)
  - [ ] Varied transaction volumes (100-2000 per user)
  - [ ] Different credit utilization levels
  - [ ] Mix of users with/without liabilities
- [ ] No real PII (fake names, random IDs)
- [ ] Data includes accounts, transactions, liabilities
- [ ] Script can be run with: `npm run generate:data`
- [ ] Output saved to `./data/synthetic-users.json`
- [ ] Unit tests verify data structure validity

### Testing

```typescript
// tests/scripts/generateRandomPlaidData.test.ts
import { describe, it, expect } from 'vitest';
import { generateSyntheticUsers } from '../../scripts/lib/generators/userGenerator';

describe('Synthetic Data Generator', () => {
  it('generates specified number of users', () => {
    const users = generateSyntheticUsers(10);
    expect(users).toHaveLength(10);
  });

  it('each user has required fields', () => {
    const users = generateSyntheticUsers(5);
    users.forEach(user => {
      expect(user.user_id).toBeDefined();
      expect(user.name.first).toBeDefined();
      expect(user.name.last).toBeDefined();
      expect(user.accounts.length).toBeGreaterThan(0);
      expect(user.transactions.length).toBeGreaterThan(0);
    });
  });

  it('generates valid account structures', () => {
    const users = generateSyntheticUsers(5);
    users.forEach(user => {
      user.accounts.forEach(account => {
        expect(account.account_id).toBeDefined();
        expect(account.type).toMatch(/depository|credit|loan/);
        expect(account.balances.current).toBeTypeOf('number');
        expect(account.balances.iso_currency_code).toBe('USD');
      });
    });
  });

  // TODO: Add more tests for transactions, liabilities, etc.
});
```

---

## Story 3: Database Schema & Authentication

### Goals
- Design Prisma schema based on synthetic data structure
- Set up Supabase project
- Configure Supabase authentication
- Create database migrations
- Add admin role flag to user model

### File Structure

```
prisma/
├── schema.prisma           # Prisma schema definition
└── migrations/             # Database migrations
.env                        # Add DATABASE_URL
```

### Implementation Details

#### 1. Install Prisma

```bash
npm install prisma @prisma/client
npm install @supabase/supabase-js
npx prisma init
```

#### 2. Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model (integrates with Supabase Auth)
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  isAdmin       Boolean       @default(false)
  consentStatus Boolean       @default(false)
  consentDate   DateTime?

  assessments   Assessment[]
  chatHistory   ChatMessage[]

  @@map("users")
}

// Assessment model - stores one assessment per user
model Assessment {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Assessment data (stored as JSONB)
  priorityInsight   Json     // Priority persona insight
  additionalInsights Json    // Array of additional insights
  eligibilityMetrics Json    // Aggregated metrics for offer eligibility
  decisionTree      Json     // Decision trace

  // Metadata
  createdAt         DateTime @default(now())
  archived          Boolean  @default(false)

  chatMessages      ChatMessage[]

  @@map("assessments")
  @@index([userId, createdAt(sort: Desc)])
}

// Partner Offer model
model PartnerOffer {
  id                  String   @id @default(uuid())
  offerName           String
  offerPitch          String   @db.Text
  targetedPersonas    String[] // Array of persona names
  priorityPerPersona  Json     // { "High Utilization": 1, "Variable Income": 2, etc. }
  eligibilityReqs     Json     // Requirements object
  activeDateStart     DateTime
  activeDateEnd       DateTime?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("partner_offers")
}

// Chat message model
model ChatMessage {
  id           String     @id @default(uuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)

  role         String     // 'user' or 'assistant'
  content      String     @db.Text
  flagged      Boolean    @default(false)

  createdAt    DateTime   @default(now())

  @@map("chat_messages")
  @@index([assessmentId, createdAt])
}
```

#### 3. Supabase Setup Instructions

Add to setup documentation:

```markdown
### Supabase Setup

1. Create Supabase project at https://supabase.com
2. Get your project URL and anon key from Settings → API
3. Get your database URL from Settings → Database → Connection string (URI)
4. Update .env:
   - SUPABASE_URL=your_project_url
   - SUPABASE_ANON_KEY=your_anon_key
   - DATABASE_URL=your_database_url
5. Run migrations: `npx prisma migrate dev`
```

#### 4. Supabase Client Setup (guardrails/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Auth helpers
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

#### 5. Prisma Client Setup (guardrails/prisma.ts)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

#### 6. Run Initial Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### 7. Update package.json Scripts

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

### Acceptance Criteria

- [ ] Prisma schema created with all models (User, Assessment, PartnerOffer, ChatMessage)
- [ ] Supabase project created and configured
- [ ] DATABASE_URL added to .env
- [ ] Initial migration runs successfully
- [ ] Prisma client generated
- [ ] Can connect to Supabase from code
- [ ] Supabase Auth configured (email/password)
- [ ] Can create test user via Supabase Auth
- [ ] Admin role flag exists on User model
- [ ] All foreign keys and indexes properly configured

### Testing

```typescript
// tests/guardrails/prisma.test.ts
import { describe, it, expect } from 'vitest';
import { prisma } from '../../guardrails/prisma';

describe('Database Connection', () => {
  it('connects to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  it('can create and query user', async () => {
    const email = `test-${Date.now()}@example.com`;

    const user = await prisma.user.create({
      data: {
        email,
        consentStatus: true
      }
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.isAdmin).toBe(false);
    expect(user.consentStatus).toBe(true);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
  });
});
```

---

## Phase 1 Completion Checklist

### Story 1: Project Setup & Infrastructure
- [ ] All dependencies installed
- [ ] TypeScript configured with path aliases
- [ ] Environment variables configured (.env from .env.example)
- [ ] Setup scripts (setup.bat/setup.sh) work
- [ ] README skeleton created
- [ ] GitHub Actions workflow created
- [ ] All module folders created
- [ ] Git repository initialized with proper .gitignore

### Story 2: Synthetic Data Generator
- [ ] CLI script generates 50-100 users
- [ ] Data matches Plaid schema structure
- [ ] Diverse financial situations represented
- [ ] Can run via `npm run generate:data`
- [ ] Output saved to ./data/synthetic-users.json
- [ ] Unit tests pass

### Story 3: Database Schema & Authentication
- [ ] Prisma schema created
- [ ] Supabase project configured
- [ ] Initial migration successful
- [ ] Can authenticate with Supabase
- [ ] Can create test users
- [ ] All database models properly related

### Integration Test
- [ ] Run `setup.bat` / `setup.sh` on fresh clone
- [ ] Generate synthetic data
- [ ] Connect to database and create test user
- [ ] Verify all tests pass
- [ ] Commit and push triggers CI/CD pipeline
- [ ] GitHub Actions runs successfully

---

## Next Steps

After completing Phase 1, move to Phase 2: Core Functionality - Part 1 (Stories 4-7)
See `phase2.md` for detailed implementation guide.
