# Phase 4: Server & Authentication

**Stories 12-17** - Server-side features: authentication, data storage, partner offers, consent management, and admin tools.

**Architecture Note**: All server-side functionality uses **Vercel serverless functions** (`/api` routes). This unified serverless architecture handles Plaid integration, authentication, data persistence, consent checks, and AI integration (Phase 5). Deploy via GitHub push → Vercel auto-deploys.

**Important**: Each story in this phase needs to be built BOTH in the UI and in the CLI. Everything needs well-documented CLI commands so devs can easily manage data.

---

## Story 12: Authentication & Account Creation

### Goals
- Implement Supabase Auth for user authentication
- Build signup/login flows in UI
- Create user accounts table in database
- NO admin promotion yet - use CLI for that (Story 17)
- Integrate auth with frontend from Phase 3

### Key Considerations
- Split from Story 8 in old planning - auth was bundled with frontend setup
- Use Supabase Auth (already in PRD tech stack)
- Login cookies are the only persistent browser data
- Server must check auth before any protected operations
- Each authenticated user has internal account ID (shown to admins, not to users)

### File Structure

```
Database Schema (Supabase):
- users table
  - id (UUID, primary key)
  - email (unique)
  - created_at
  - updated_at
  - is_admin (boolean, default false)

API Routes (Vercel):
- /api/auth/signup
- /api/auth/login
- /api/auth/logout
- /api/auth/session

Frontend (React):
- src/pages/Login.tsx
- src/pages/Signup.tsx
- src/lib/auth.ts
- src/contexts/AuthContext.tsx
```

### Implementation Notes
- Use Supabase Auth client in frontend
- Protected routes require authentication
- Auth context provides user session to components
- Redirect to login if not authenticated
- Store session in Supabase (not browser, except login cookies)

### Acceptance Criteria
- [ ] Users can sign up with email/password
- [ ] Users can log in
- [ ] Users can log out
- [ ] Protected routes redirect to login
- [ ] Session persists across page refreshes
- [ ] Auth integrated with existing Phase 3 UI
- [ ] CLI command to promote user to admin (in Story 17)

---

## Story 13: Partner Offers Catalog & Eligibility Engine

### Goals
- Create partner offers database table
- Build eligibility calculator (moved from old Story 6)
- Match offers to users based on eligibility requirements
- Implement CLI CRUD tools for managing offers
- Build UI for admins to VIEW offers (editing in Next Steps)
- Filter offers based on eligibility and prevent harmful suggestions

### Key Considerations
- Split from old Story 6 (Assessment Engine Core) and old Story 8 (Partner Offers Catalog)
- Eligibility engine was removed from Phase 2 Story 6
- Uses eligibility metrics calculated from signals
- Partner offers stored server-side in database
- Placeholder/demo data initially
- CLI tooling needs environment checks to prevent accidental production modifications
- Admins can view in admin dashboard, but editing requires CLI (UI editing in Next Steps)

### Database Schema

```sql
partner_offers table:
- id (UUID, primary key)
- offer_name (text)
- offer_pitch (text) -- User-facing description
- targeted_personas (text[]) -- Array of persona types
- priority_per_persona (jsonb) -- { "High Utilization": 1, "Savings Builder": 3 }
- eligibility_requirements (jsonb) -- Thresholds and rules
- active_date_start (timestamp)
- active_date_end (timestamp)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Eligibility Requirements Structure

```typescript
interface EligibilityRequirements {
  // Credit requirements
  maxCreditUtilization?: number; // User must be <= this
  minCreditUtilization?: number; // User must be >= this

  // Savings requirements
  minSavingsBalance?: number;
  minEmergencyFundCoverage?: number; // Months

  // Income requirements
  minMonthlyIncome?: number;
  incomeStability?: 'stable' | 'variable' | 'any';

  // Existing accounts (prevent duplicate products)
  requiresNoSavingsAccount?: boolean;
  requiresNoCreditCard?: boolean;
  requiresNoMoneyMarket?: boolean;
  requiresNoHSA?: boolean;

  // Custom rules (future expansion)
  customRules?: string[];
}
```

### Eligibility Metrics Calculation

Moved from old Phase 2 Story 6 - calculate these from signals and store with assessment:

```typescript
interface EligibilityMetrics {
  // Credit metrics
  maxCreditUtilization: number;
  avgCreditUtilization: number;
  totalCreditBalance: number;
  totalCreditLimit: number;
  totalInterestPaid: number;

  // Savings metrics
  totalSavingsBalance: number;
  emergencyFundCoverage: number; // Months

  // Income metrics
  estimatedMonthlyIncome: number;
  incomeStability: 'stable' | 'variable' | 'unknown';

  // Existing accounts
  hasCheckingAccount: boolean;
  hasSavingsAccount: boolean;
  hasCreditCard: boolean;
  hasMoneyMarket: boolean;
  hasHSA: boolean;
}
```

### CLI Tools

```
scripts/
└── manageOffers.ts  # CRUD for partner offers

Commands:
- npm run offers:list
- npm run offers:create <json-file>
- npm run offers:update <id> <json-file>
- npm run offers:delete <id>
- npm run offers:activate <id>
- npm run offers:deactivate <id>

Environment checks:
- Require --env=production flag for prod database
- Default to development database
- Confirmation prompt before destructive operations
```

### File Structure

```
features/
└── eligibility/
    ├── index.ts                   # Main eligibility engine
    ├── calculator.ts              # Calculate eligibility metrics from signals
    ├── matcher.ts                 # Match offers to user based on metrics
    └── types.ts                   # Eligibility types

api/
└── offers/
    ├── list.ts                    # GET /api/offers (admin only)
    ├── [id].ts                    # GET /api/offers/:id (admin only)

scripts/
└── manageOffers.ts                # CLI CRUD tools

Frontend (admin only):
└── src/pages/admin/Offers.tsx     # View offers (no editing yet)
```

### Acceptance Criteria
- [ ] Partner offers table created in database
- [ ] Eligibility metrics calculator working (from signals)
- [ ] Eligibility matcher filters offers based on requirements
- [ ] No payday loans or predatory products flagged
- [ ] CLI tools for CRUD operations working
- [ ] Environment checks prevent accidental prod modifications
- [ ] Admin UI displays offers (view only)
- [ ] Offers attached to insights based on persona and eligibility

---

## Story 14: Consent Management

### Goals
- Create consent table in database
- Request explicit consent immediately after account creation
- Server-side consent check before ALL processing operations
- UI for viewing and revoking consent
- Block operations if consent missing or revoked

### Key Considerations
- CRITICAL: Server-side consent check required before ANY data processing
- Consent status fetched from Supabase before Plaid connection allowed
- Consent verification before assessment generation
- Consent revocation immediately blocks all processing
- Clear user messaging when operations blocked due to missing consent

### Database Schema

```sql
consent table:
- user_id (UUID, foreign key to users, primary key)
- consent_granted (boolean)
- consent_date (timestamp)
- consent_revoked (boolean)
- revoked_date (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### API Routes

```
/api/consent/status     # GET - Check consent status
/api/consent/grant      # POST - Grant consent
/api/consent/revoke     # POST - Revoke consent
```

### UI Flow

```
1. User signs up
2. Immediately redirect to consent page
3. User reads consent terms and grants/denies
4. If granted: allow Plaid connection
5. If denied: block all processing, show message
6. User can revoke consent any time from settings
```

### Consent Checks

Every protected operation must check consent:
- Plaid connection
- Assessment generation (server-side storage)
- AI chat
- Admin viewing user data

### File Structure

```
api/
└── consent/
    ├── status.ts
    ├── grant.ts
    └── revoke.ts

Frontend:
└── src/
    ├── pages/Consent.tsx
    ├── pages/Settings.tsx (includes consent revocation)
    └── lib/consent.ts
```

### Acceptance Criteria
- [ ] Consent table created
- [ ] Consent requested immediately after signup
- [ ] Server checks consent before Plaid connection
- [ ] Server checks consent before assessment storage
- [ ] User can view consent status in settings
- [ ] User can revoke consent any time
- [ ] Revocation blocks all future operations
- [ ] Clear messaging when operations blocked

---

## Story 15: Assessment Storage & Archival

### Goals
- Create assessments table in database
- Store assessment with underlying data structures (NOT raw financial data)
- Store eligibility metrics with assessment
- Store decision trees with assessment
- Automatic archival when new assessment generated
- Most recent assessment is always active (no archived flag needed)

### Key Considerations
- Raw financial data NEVER reaches server (processed client-side in Phase 3)
- Store underlying data structures for each insight (e.g., subscription arrays)
- Store eligibility metrics to support confident partner offer suggestions
- Store decision trees for explainability
- Rendering functions in codebase (not database) render insights from data structures
- When user imports new data, previous assessment automatically archived
- Archived assessments retained for future analysis but not displayed to users

### Database Schema

```sql
assessments table:
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- priority_insight (jsonb) -- Underlying data structure
- additional_insights (jsonb[]) -- Array of underlying data structures
- eligibility_metrics (jsonb) -- Calculated metrics
- decision_tree (jsonb) -- Explanation of persona assignment
- created_at (timestamp)
- updated_at (timestamp)
- is_archived (boolean, default false) -- Set to true when new assessment created
```

### Assessment Storage Flow

```
1. User connects Plaid (Phase 3 client-side processing)
2. Assessment generated in browser
3. POST assessment to /api/assessments
4. Server checks consent
5. Server checks if previous assessment exists
6. If exists: set is_archived = true on old assessment
7. Store new assessment with is_archived = false
8. Return success
```

### API Routes

```
/api/assessments              # POST - Store new assessment
/api/assessments/current      # GET - Fetch current assessment
/api/assessments/history      # GET - Fetch archived assessments (optional)
```

### Data Flush Button

```
/api/user/flush-data          # POST - Delete all user data

Deletes:
- Active assessment
- Archived assessments
- AI chat history (Story 18)
- Consent record (user can re-consent if they want)
```

### File Structure

```
api/
└── assessments/
    ├── index.ts           # POST /api/assessments
    ├── current.ts         # GET /api/assessments/current
    └── history.ts         # GET /api/assessments/history

api/
└── user/
    └── flush-data.ts      # POST /api/user/flush-data

Frontend:
└── src/
    ├── pages/Settings.tsx (includes flush data button)
    └── lib/assessments.ts
```

### Acceptance Criteria
- [ ] Assessments table created
- [ ] Assessment stored with underlying data structures
- [ ] Eligibility metrics stored with assessment
- [ ] Decision trees stored with assessment
- [ ] Previous assessment archived when new one created
- [ ] Current assessment fetched and displayed
- [ ] User can flush all data via settings
- [ ] Flush deletes active/archived assessments and chat history
- [ ] NO raw financial data ever stored server-side

---

## Story 16: Admin Dashboard UI

### Goals
- Build admin dashboard for viewing user assessments
- Admin sees everything user sees (including specific financial numbers)
- Username/email masked, internal account ID shown
- View assessment, decision trees, and detected signals
- View AI chat history (Story 18)
- Flag problematic AI responses for developer review

### Key Considerations
- Admins see specific financial data from assessments (not raw Plaid data)
- Admins do NOT see username/email (anonymized)
- Admins see internal account ID for reference
- Full decision traceability: signals detected, personas considered, matching criteria
- Admin can flag AI responses for guardrail refinement

### UI Structure

```
Admin Dashboard:
- User list (shows account ID, assessment date, NOT username/email)
- User detail view:
  - Account ID: abc-123-def
  - Username: [MASKED]
  - Email: [MASKED]
  - Assessment created: 2024-03-15
  - Consent status: Granted

  Assessment Display:
  - Priority insight (same as user sees)
  - Additional insights (same as user sees)
  - Decision tree (same as user sees)
  - Specific financial numbers from underlying data

  AI Chat History (Story 18):
  - User questions
  - AI responses
  - Flag button for problematic responses
```

### API Routes

```
/api/admin/users              # GET - List all users (account IDs only)
/api/admin/users/:id          # GET - User details (masked username/email)
/api/admin/assessments/:id    # GET - User's assessment
/api/admin/chat/:id           # GET - User's chat history (Story 18)
/api/admin/flag-response      # POST - Flag AI response for review
```

### File Structure

```
api/
└── admin/
    ├── users.ts
    ├── [id].ts
    ├── assessments/[id].ts
    ├── chat/[id].ts
    └── flag-response.ts

Frontend:
└── src/pages/admin/
    ├── Dashboard.tsx
    ├── UserList.tsx
    ├── UserDetail.tsx
    └── ChatHistory.tsx (Story 18)
```

### Acceptance Criteria
- [ ] Admin dashboard displays user list (account IDs only)
- [ ] Admin can view user assessment
- [ ] Username/email masked in admin view
- [ ] Internal account ID shown
- [ ] Assessment displays same as user sees (including specific numbers)
- [ ] Decision tree displays in admin view
- [ ] Admin can view AI chat history (Story 18)
- [ ] Admin can flag problematic AI responses
- [ ] Protected: only users with is_admin = true can access

---

## Story 17: CLI Admin Tools

### Goals
- Build CLI tools for admin operations
- Promote users to admin via CLI
- View user data via CLI
- Manage partner offers via CLI (from Story 13)
- Run database migrations
- Seed demo data

### CLI Commands

```bash
# Admin management
npm run admin:promote <email>       # Set is_admin = true
npm run admin:demote <email>        # Set is_admin = false
npm run admin:list                  # List all admins

# User management
npm run user:list                   # List all users
npm run user:view <email>           # View user details
npm run user:delete <email>         # Delete user and all data

# Partner offers (from Story 13)
npm run offers:list
npm run offers:create <json-file>
npm run offers:update <id> <json-file>
npm run offers:delete <id>

# Database operations
npm run db:migrate                  # Run Prisma migrations
npm run db:seed                     # Seed demo data
npm run db:reset                    # Reset database (dev only)
```

### File Structure

```
scripts/
├── admin/
│   ├── promote.ts
│   ├── demote.ts
│   └── list.ts
├── users/
│   ├── list.ts
│   ├── view.ts
│   └── delete.ts
├── manageOffers.ts (from Story 13)
└── db/
    ├── migrate.ts
    ├── seed.ts
    └── reset.ts
```

### Safety Checks

```typescript
// Environment checks
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  Production environment detected');
  console.log('Add --env=production flag to confirm');
  if (!args.includes('--env=production')) {
    process.exit(1);
  }
}

// Confirmation prompts for destructive operations
const confirmed = await promptConfirmation('Delete user and all data? (y/n): ');
if (!confirmed) {
  console.log('Cancelled');
  process.exit(0);
}
```

### Acceptance Criteria
- [ ] CLI can promote users to admin
- [ ] CLI can list all users
- [ ] CLI can view user details
- [ ] CLI can manage partner offers (Story 13)
- [ ] CLI has environment checks for production
- [ ] CLI requires confirmation for destructive operations
- [ ] Database migrations work via CLI
- [ ] Seed script creates demo data

---

## Phase 4 Completion Checklist

### Story 12: Authentication & Account Creation
- [ ] Supabase Auth integrated
- [ ] Signup/login flows working
- [ ] Users table created
- [ ] Protected routes redirect to login
- [ ] Session persists across refreshes

### Story 13: Partner Offers Catalog & Eligibility Engine
- [ ] Partner offers table created
- [ ] Eligibility metrics calculator working
- [ ] Eligibility matcher filters offers
- [ ] CLI CRUD tools working
- [ ] Admin UI displays offers (view only)
- [ ] Offers attached to insights

### Story 14: Consent Management
- [ ] Consent table created
- [ ] Consent requested after signup
- [ ] Server checks consent before operations
- [ ] User can revoke consent
- [ ] Revocation blocks operations

### Story 15: Assessment Storage & Archival
- [ ] Assessments table created
- [ ] Assessment storage working
- [ ] Previous assessments archived
- [ ] User can flush all data
- [ ] NO raw financial data stored

### Story 16: Admin Dashboard UI
- [ ] Admin dashboard displays users
- [ ] Admin can view assessments
- [ ] Username/email masked
- [ ] Admin can flag AI responses
- [ ] Protected admin-only access

### Story 17: CLI Admin Tools
- [ ] CLI can promote admins
- [ ] CLI can manage users
- [ ] CLI can manage offers
- [ ] Environment checks working
- [ ] Database operations via CLI

### Integration Test
- [ ] Full flow: Signup → Consent → Plaid → Assessment → Storage
- [ ] Admin can view stored assessment
- [ ] User can flush data successfully
- [ ] Consent revocation blocks operations
- [ ] Partner offers filtered by eligibility
- [ ] Both UI and CLI work for all features

---

## Next Steps

After completing Phase 4, move to Phase 5: AI Integration (Stories 18-19)
See `phase-5.md` for detailed implementation guide.
