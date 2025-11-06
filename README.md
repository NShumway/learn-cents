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

**Supabase Setup:**

1. Create a project at [supabase.com](https://supabase.com)
2. Go to `Settings > API` to get:
   - `SUPABASE_URL` - Project URL
   - `SUPABASE_ANON_KEY` - anon public key
   - `SUPABASE_SERVICE_KEY` - service_role key (keep secret!)
3. Go to `Settings > Database > Connection string > URI` (enable "Use connection pooling"):
   - `DATABASE_URL` - Copy the full PostgreSQL connection string (format: `postgresql://...`)
4. Add frontend environment variables:
   - `VITE_SUPABASE_URL` - Same as SUPABASE_URL
   - `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY

**Other Services:**

- `OPENAI_API_KEY` - OpenAI API key for AI chat
- `PLAID_CLIENT_ID` - Plaid client ID (sandbox)
- `PLAID_SECRET` - Plaid secret key (sandbox)

**Important**: The `DATABASE_URL` must be the full PostgreSQL connection string starting with `postgresql://`, not the Supabase project URL.

### Database Setup

After configuring environment variables, run Prisma migrations:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

This creates the required tables: `users`, `assessments`, `partner_offers`, `chat_messages`.

**Create First Admin User:**

1. Sign up at `http://localhost:5173/signup`
2. Promote to admin via CLI:

```bash
npm run admin:promote your@email.com --confirm
```

### Development

```bash
# Start frontend (Vite)
npm run dev:ui

# Start API server (Vercel)
npm run dev:api

# Run tests
npm test

# Type check and lint
npm run check
```

Access the app at `http://localhost:5173`

**Pre-commit Hooks**: This project uses husky and lint-staged to automatically format and lint code before commits. All staged files are formatted with Prettier and linted with ESLint on every commit.

For a complete list of all CLI tools including data generation, testing, and analysis commands, see the [CLI Tools Reference](./docs/cli-tools.md).

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

### Planning

- [PRD](./planning/PRD.md) - Product Requirements Document
- [Development Phases](./planning/dev-phases.md) - Development roadmap
- [Phase 1](./planning/phase-1.md) - Foundation phase details
- [Phase 2](./planning/phase-2.md) - Core functionality implementation

### Technical Specs

- [Plaid Data Structure](./docs/plaid-data-structure.md) - Plaid API data format and field specifications
- [Data Ingestion Format](./docs/data-ingestion-format.md) - JSON/CSV ingestion specification
- [Signal Detection](./docs/signal-detection.md) - Behavioral signal detection criteria and algorithms

### Developer Tools

- [CLI Tools Reference](./docs/cli-tools.md) - Complete reference for all CLI tools (testing, data generation, analysis)

## License

MIT

---

**Note**: This is educational software, not financial advice. All recommendations include appropriate disclaimers.
