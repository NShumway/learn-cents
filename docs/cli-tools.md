# CLI Tools Quick Reference

## Development & Build

| Command | Description |
|---------|-------------|
| `./setup.sh` or `setup.bat` | Initial project setup (install dependencies, configure environment) |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (TypeScript + bundling) |
| `npm run typecheck` | Run TypeScript type checking without emitting files |
| `npm run lint` | Lint TypeScript/TSX files using ESLint |
| `npm run format` | Format code files (TS, JSON, MD) using Prettier |

## Data Generation

| Command | Description |
|---------|-------------|
| `npm run generate:data` | Generate 50 synthetic users → `./data/synthetic-users.json` |
| `npm run generate:data -- --count 100` | Generate 100 synthetic users |
| `npm run generate:data -- --output ./data/test` | Generate to custom path |
| `npm run explore:plaid` | Fetch Plaid sandbox data → `./data/plaid-user-data.json` (requires `.env`) |

## Data Analysis

| Command | Description |
|---------|-------------|
| `npm run run:assessment` | Generate assessment for first user (synthetic data, default) |
| `npm run run:assessment 5` | Generate assessment for user at index 5 |
| `npm run run:assessment -- --source plaid` | Generate assessment using Plaid sandbox data |
| `npm run run:assessment 5 -- --source synthetic` | Generate assessment for user 5 from synthetic data |

## Database Management

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run database migrations using Prisma |
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:studio` | Open Prisma Studio GUI for database management |
| `npm run db:push` | Push schema changes to database without creating migrations |
| `npm run db:seed` | Seed database with initial data |

## Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with Vitest |
| `npm test path/to/test.ts` | Run specific test file |
| `npm test -- --coverage` | Run tests with coverage |
| `npm run test:ui` | Run tests with interactive UI |
| `npm run test:personas` | Test persona assignment on first user (synthetic data) |
| `npm run test:personas 5` | Test persona assignment on user at index 5 |
| `npm run test:personas all` | Test all users and show persona distribution |
