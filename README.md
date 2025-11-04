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
- [Development Phases](./planning/dev-phases.md) - Development roadmap
- [Phase 1](./planning/phase-1.md) - Foundation phase details

## License

MIT

---

**Note**: This is educational software, not financial advice. All recommendations include appropriate disclaimers.
