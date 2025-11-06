# CLI Tools Quick Reference

## Common Commands

| Command                  | Description                                         | Optional Arguments                                                         |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| `./setup.sh`             | Initial project setup (install deps, configure env) |                                                                            |
| `vercel dev`             | Start full-stack dev server (UI + API)              |                                                                            |
| `npm run check`          | Run TypeScript type checking and ESLint             |                                                                            |
| `npm run generate:data`  | Generate synthetic user data                        | `--count <num>` (default: 50)<br>`--output <path>`                         |
| `npm run explore:plaid`  | Fetch Plaid sandbox data (requires `.env`)          |                                                                            |
| `npm run run:assessment` | Generate financial assessment                       | `<index>` (default: 0)<br>`--source plaid\|synthetic` (default: synthetic) |
| `npm test`               | Run tests with Vitest                               | `<path>` (specific test file)<br>`--coverage`                              |

## All Commands

| Command                 | Description                                     | Optional Arguments |
| ----------------------- | ----------------------------------------------- | ------------------ |
| `npm run dev`           | Start UI-only dev server (no API routes)        |                    |
| `npm run build`         | Build for production (TypeScript + bundling)    |                    |
| `npm run deploy`        | Deploy to Vercel production                     |                    |
| `npm run format`        | Format code files (TS, JSON, MD) using Prettier |                    |
| `npm run test:ui`       | Run tests with interactive UI                   |                    |
| `npm run test:personas` | Test persona assignment                         | `<index>` or `all` |
| `npm run db:migrate`    | Run database migrations using Prisma            |                    |
| `npm run db:generate`   | Generate Prisma client from schema              |                    |
| `npm run db:studio`     | Open Prisma Studio GUI for database management  |                    |
| `npm run db:push`       | Push schema changes to database (no migrations) |                    |
| `npm run db:seed`       | Seed database with initial data                 |                    |
