# Contributing to Learn Cents

## Development Workflow

### Getting Started

1. Fork and clone the repository
2. Run `./setup.sh` (Mac/Linux) or `setup.bat` (Windows)
3. Configure your `.env` file with required API keys
4. Start developing!

## Code Quality & Pre-commit Hooks

This project uses **husky** and **lint-staged** to maintain code quality:

### What Happens on Commit

When you run `git commit`, the pre-commit hook automatically:

1. **Formats staged files** with Prettier
2. **Lints staged files** with ESLint (auto-fixes when possible)
3. **Type checks entire project** with TypeScript
4. **Rejects commit** if any checks fail

### Manual Commands

You can run these checks manually anytime:

```bash
# Run TypeScript type checking + ESLint
npm run check

# Format all files with Prettier
npm run format
```

### Why Pre-commit Hooks?

- ✅ **Automatic formatting** - No manual `npm run format` needed
- ✅ **Catch errors early** - TypeScript and lint errors caught before commit
- ✅ **Consistent code** - All commits meet quality standards
- ✅ **Fast** - Only staged files are formatted/linted

### Bypassing Hooks (Not Recommended)

If you need to bypass the pre-commit hook (e.g., WIP commit), use:

```bash
git commit --no-verify -m "WIP: work in progress"
```

**Note**: CI/CD will still run all checks, so bypassing locally only delays feedback.

## Testing

Run tests before pushing:

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.ts

# Run with coverage
npm test -- --coverage
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run check` passes
4. Ensure `npm test` passes
5. Push to your fork
6. Open a pull request to `main`

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with default settings
- **Linting**: ESLint with TypeScript plugin
- **Naming**: camelCase for variables/functions, PascalCase for types/components

## Project Structure

```
src/
├── ingest/       - Data loading and validation
├── signals/      - Signal detection (credit, income, etc.)
├── personas/     - Persona assignment logic
├── rendering/    - Insight rendering
├── types/        - TypeScript type definitions
ui/
├── components/   - React components
├── pages/        - Page components
├── lib/          - Utilities and helpers
api/
├── plaid/        - Plaid integration endpoints
```

## Questions?

Open an issue or reach out to the maintainers.
