# Phase 4: Server & Authentication

**Stories 12-17** - Server-side features: authentication, data storage, partner offers, consent management, and admin tools.

**Architecture Note**: All server-side functionality uses **Vercel serverless functions** (`/api` routes). This unified serverless architecture handles Plaid integration, authentication, data persistence, consent checks, and AI integration (Phase 5). Deploy via GitHub push → Vercel auto-deploys.

**Important**: Each story in this phase needs to be built BOTH in the UI and in the CLI. Everything needs well-documented CLI commands so devs can easily manage data.

**Story Order**: Stories are ordered by implementation dependency: 12 → 15 → 14 → 16 → 17 → 13

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
  - consent_status (boolean, default false)
  - consent_date (timestamp, nullable)

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

## Story 15: Assessment Storage & Archival

### Goals

- Create assessments table in database
- Store assessment with underlying data structures (NOT raw financial data)
- Store eligibility metrics with assessment
- Store decision trees with assessment
- Automatic archival when new assessment generated
- Archived assessments stored in same table with `archived` flag
- User can delete all data via settings

### Key Considerations

- Raw financial data NEVER reaches server (processed client-side in Phase 3)
- Store underlying data structures for each insight (e.g., subscription arrays)
- Store eligibility metrics to support confident partner offer suggestions
- Store decision trees for explainability
- Rendering functions in codebase (not database) render insights from data structures
- When user imports new data, previous assessment automatically archived
- **Archived assessments NOT displayed to users** - only viewable in admin portal
- Archived assessments deleted when user deletes their data
- Single table approach with `is_archived` flag for simplicity

### Database Schema

```sql
assessments table:
- id (UUID, primary key)
- user_id (UUID, foreign key to users, CASCADE on delete)
- priority_insight (jsonb) -- Underlying data structure
- additional_insights (jsonb[]) -- Array of underlying data structures
- eligibility_metrics (jsonb) -- Calculated metrics
- decision_tree (jsonb) -- Explanation of persona assignment
- created_at (timestamp)
- updated_at (timestamp)
- is_archived (boolean, default false) -- Set to true when new assessment created
- is_flagged (boolean, default false) -- Admin can flag concerning assessments
- flagged_at (timestamp, nullable)
- flagged_by (UUID, nullable, foreign key to users) -- Admin who flagged
- flag_reason (text, nullable) -- Optional reason for flagging
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
/api/assessments/archived     # GET - Fetch archived assessments (admin only)
```

### User Data Deletion

```
/api/user/delete-account      # POST - Delete user account and ALL data

Hard delete with CASCADE:
- User record (users table)
- All assessments (current + archived) - CASCADE
- All AI chat history (Story 18) - CASCADE
- All consent records - CASCADE

Physically removes all data from database.
User account is completely deleted, email becomes available again.
```

### File Structure

```
api/
└── assessments/
    ├── index.ts           # POST /api/assessments
    ├── current.ts         # GET /api/assessments/current
    └── archived.ts        # GET /api/assessments/archived (admin only)

api/
└── user/
    └── delete-account.ts  # POST /api/user/delete-account

Frontend:
└── src/
    ├── pages/Settings.tsx (includes delete account button)
    └── lib/assessments.ts
```

### Acceptance Criteria

- [ ] Assessments table created with `is_archived` and flagging fields
- [ ] Assessment stored with underlying data structures
- [ ] Eligibility metrics stored with assessment
- [ ] Decision trees stored with assessment
- [ ] Previous assessment archived when new one created
- [ ] Current assessment fetched and displayed (archived NOT shown to users)
- [ ] User can delete account and ALL data via settings
- [ ] Hard delete with CASCADE removes user + all related data
- [ ] NO raw financial data ever stored server-side
- [ ] Admins can view archived assessments (Story 16)

---

## Story 14: Consent Management

### Goals

- Track consent in user table
- Request explicit consent immediately after account creation
- Server-side consent check before ALL processing operations
- UI for viewing and revoking consent
- Block operations if consent missing or revoked
- **Consent revocation offers data deletion**
- Separate "revoke consent" and "delete data" actions

### Key Considerations

- CRITICAL: Server-side consent check required before ANY data processing
- Consent status stored in `users.consent_status` boolean field
- Consent verification before assessment generation
- Consent revocation immediately blocks all processing
- **When user revokes consent, prompt to also delete their data**
- Clear user messaging when operations blocked due to missing consent
- User can revoke consent without deleting data (just blocks future processing)
- User can delete data separately via account deletion

### Database Schema

Consent tracked in users table (from Story 12):

```sql
users table:
- consent_status (boolean, default false)
- consent_date (timestamp, nullable)
```

### API Routes

```
/api/consent/status     # GET - Check consent status (returns users.consent_status)
/api/consent/grant      # POST - Grant consent (set consent_status = true)
/api/consent/revoke     # POST - Revoke consent (set consent_status = false)
                        #        Returns prompt to also delete data
```

### UI Flow

```
1. User signs up
2. Immediately redirect to consent page
3. User reads consent terms and grants/denies
4. If granted: allow Plaid connection
5. If denied: block all processing, show message
6. User can revoke consent any time from settings
7. When revoking, prompt: "Would you also like to delete your data?"
   - If yes: redirect to account deletion flow
   - If no: just revoke consent (blocks future processing)
```

### Consent Checks

Every protected operation must check `users.consent_status`:

- Plaid connection
- Assessment generation (server-side storage)
- AI chat (Story 18)
- Admin viewing user data (show consent status in admin view)

### File Structure

```
api/
└── consent/
    ├── status.ts   # GET consent status
    ├── grant.ts    # POST grant consent
    └── revoke.ts   # POST revoke consent (prompt to delete data)

Frontend:
└── src/
    ├── pages/Consent.tsx
    ├── pages/Settings.tsx (includes consent revocation + delete account)
    └── lib/consent.ts
```

### Settings Page UI

```
Settings Page:

[Consent Management]
Status: ✅ Consent granted on 2024-03-15
[Revoke Consent] button

[Account Management]
Danger Zone:
[Delete My Account and All Data] button (requires confirmation)
```

### Consent Revocation Flow

```
1. User clicks "Revoke Consent" in settings
2. Confirmation modal:
   "Are you sure you want to revoke consent?
    This will prevent future data processing.

    Would you also like to delete all your existing data?

    [Revoke Consent Only] [Revoke & Delete Data] [Cancel]"

3. If "Revoke Consent Only":
   - Set consent_status = false
   - Block future operations
   - Keep existing assessments

4. If "Revoke & Delete Data":
   - Set consent_status = false
   - Redirect to account deletion flow
   - Hard delete user + all data
```

### Acceptance Criteria

- [ ] Consent tracked in users.consent_status field
- [ ] Consent requested immediately after signup
- [ ] Server checks consent before Plaid connection
- [ ] Server checks consent before assessment storage
- [ ] User can view consent status in settings
- [ ] User can revoke consent any time
- [ ] Revocation prompts to also delete data
- [ ] Revocation blocks all future operations
- [ ] Clear messaging when operations blocked
- [ ] Separate "revoke consent" and "delete account" actions

---

## Story 16: Admin Dashboard UI

### Goals

- Build admin dashboard for viewing user assessments
- Admin sees everything user sees (including specific financial numbers)
- Username/email masked, internal account ID shown
- View current AND archived assessments
- View decision trees and detected signals
- View AI chat history (Story 18)
- **Flag entire assessments** for review
- Summary view with recent insights + flagged insights list

### Key Considerations

- Admins see specific financial data from assessments (not raw Plaid data)
- Admins do NOT see username/email (anonymized)
- Admins see internal account ID for reference
- Full decision traceability: signals detected, personas considered, matching criteria
- Admin can flag entire assessments (not individual messages)
- Flagged assessments appear in separate list AND highlighted in main list
- Admin can view archived assessments with warning indicator

### Admin Dashboard Structure

```
Admin Dashboard:

[Recent Insights] (paginated)
- Account ID: abc-123-def | Created: 2024-03-15 | Status: Active
- Account ID: xyz-789-ghi | Created: 2024-03-14 | Status: Active 🚩 (flagged)
- Account ID: jkl-456-mno | Created: 2024-03-13 | Status: Active
[Load More] (pagination)

[Flagged Insights] (separate section)
- Account ID: xyz-789-ghi | Created: 2024-03-14 | Flagged: 2024-03-16
  Reason: Unusual spending pattern detected
- Account ID: pqr-111-stu | Created: 2024-03-10 | Flagged: 2024-03-12
  Reason: Multiple high-risk signals
```

### User Detail View

```
User Detail View:

[User Metadata]
Account ID: abc-123-def
Username: [MASKED]
Email: [MASKED]
Created: 2024-03-01
Consent Status: ✅ Granted (2024-03-01) | ❌ Revoked (date)
Admin Status: No

[Current Assessment] | [View Archived Assessments ▼]
(If archived selected: ⚠️ WARNING: Viewing archived assessment from 2024-02-15)

[Assessment Display]
- Priority insight (same as user sees)
- Additional insights (same as user sees)
- Decision tree (same as user sees)
- Detected signals (list)
- Specific financial numbers from underlying data

[Flagging Controls]
Status: 🚩 Flagged by admin@example.com on 2024-03-16
Reason: Unusual spending pattern detected
[Unflag Assessment] button

(If not flagged:)
[Flag Assessment] button → Modal for reason
```

### Assessment Flagging

Admin can flag entire assessments:

- Flag button opens modal to enter reason
- Flagged assessment appears in "Flagged Insights" list
- Flagged assessment highlighted (🚩 icon) in "Recent Insights" list
- Unflag button removes flag
- Tracks who flagged and when (`assessments.is_flagged`, `flagged_at`, `flagged_by`)

### Archived Assessments View

```
[Current Assessment] selected by default

[View Archived Assessments ▼]
  → Archived Assessment (2024-02-15)
  → Archived Assessment (2024-01-20)

When archived selected:
⚠️ WARNING: You are viewing an archived assessment from 2024-02-15.
[Switch to Current Assessment]

(Display archived assessment with same structure as current)
```

### API Routes

```
/api/admin/users                    # GET - List all users (account IDs only)
/api/admin/users/:id                # GET - User details (masked username/email)
/api/admin/assessments/:id          # GET - User's current assessment
/api/admin/assessments/:id/archived # GET - User's archived assessments
/api/admin/assessments/:id/flag     # POST - Flag assessment (with reason)
/api/admin/assessments/:id/unflag   # POST - Unflag assessment
/api/admin/flagged                  # GET - List all flagged assessments
/api/admin/chat/:id                 # GET - User's chat history (Story 18)
```

### File Structure

```
api/
└── admin/
    ├── users.ts
    ├── [id].ts
    ├── assessments/
    │   ├── [id].ts              # Current assessment
    │   ├── [id]/archived.ts     # Archived assessments
    │   ├── [id]/flag.ts         # Flag assessment
    │   └── [id]/unflag.ts       # Unflag assessment
    ├── flagged.ts               # List flagged assessments
    └── chat/[id].ts             # Chat history (Story 18)

Frontend:
└── src/pages/admin/
    ├── Dashboard.tsx            # Summary view (recent + flagged)
    ├── UserList.tsx             # User list
    ├── UserDetail.tsx           # User detail with assessment
    ├── ArchivedAssessments.tsx  # Archived assessments view
    └── ChatHistory.tsx          # Chat history (Story 18)
```

### Acceptance Criteria

- [ ] Admin dashboard displays recent insights (paginated)
- [ ] Separate "Flagged Insights" section displays flagged assessments
- [ ] Flagged assessments highlighted (🚩) in recent insights list
- [ ] Admin can view user assessment (current)
- [ ] Admin can view archived assessments with warning indicator
- [ ] Username/email masked in admin view
- [ ] Internal account ID shown
- [ ] User metadata displayed (created date, consent status, admin status)
- [ ] Assessment displays same as user sees (including specific numbers)
- [ ] Decision tree displays in admin view
- [ ] Detected signals listed in admin view
- [ ] Admin can flag entire assessment (with reason)
- [ ] Admin can unflag assessment
- [ ] Admin can view AI chat history (Story 18)
- [ ] Protected: only users with is_admin = true can access

---

## Story 17: CLI Admin Tools

### Goals

- Build CLI tools for admin operations
- Promote/demote users to/from admin via CLI
- View user data via CLI
- Delete user accounts via CLI
- Manage partner offers via CLI (from Story 13)
- Run database migrations
- Seed demo data
- **Require `--confirm` flag for destructive operations**

### CLI Commands

```bash
# Admin management
npm run admin:promote <email> --confirm    # Set is_admin = true
npm run admin:demote <email> --confirm     # Set is_admin = false
npm run admin:list                         # List all admins

# User management
npm run user:list                          # List all users
npm run user:view <email>                  # View user details
npm run user:delete <email> --confirm      # Delete user and all data (CASCADE)

# Partner offers (from Story 13)
npm run offers:list
npm run offers:create <json-file> --confirm
npm run offers:update <id> <json-file> --confirm
npm run offers:delete <id> --confirm

# Database operations
npm run db:migrate                         # Run Prisma migrations
npm run db:seed                            # Seed demo data
npm run db:reset --confirm                 # Reset database (dev only)
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

All destructive operations require `--confirm` flag:

```typescript
// Check for --confirm flag
if (!args.includes('--confirm')) {
  console.error('❌ This is a destructive operation.');
  console.error('   Add --confirm flag to proceed:');
  console.error(`   npm run user:delete ${email} --confirm`);
  process.exit(1);
}

// Environment checks for production
if (process.env.NODE_ENV === 'production') {
  console.log('⚠️  Production environment detected');
  console.log('Add --env=production flag to confirm');
  if (!args.includes('--env=production')) {
    process.exit(1);
  }
}
```

### Destructive Operations

Commands that require `--confirm`:

- `admin:promote` - Grants admin privileges
- `admin:demote` - Revokes admin privileges
- `user:delete` - Hard deletes user and all data (CASCADE)
- `offers:create` - Creates new partner offer
- `offers:update` - Modifies partner offer
- `offers:delete` - Deletes partner offer
- `db:reset` - Resets entire database (dev only)

### Acceptance Criteria

- [ ] CLI can promote users to admin with `--confirm` flag
- [ ] CLI can demote users from admin with `--confirm` flag
- [ ] CLI can list all admins
- [ ] CLI can list all users
- [ ] CLI can view user details
- [ ] CLI can delete users with `--confirm` flag (hard delete CASCADE)
- [ ] CLI can manage partner offers (Story 13)
- [ ] CLI rejects destructive operations without `--confirm` flag
- [ ] CLI has environment checks for production
- [ ] Database migrations work via CLI
- [ ] Seed script creates demo data

---

## Story 13: Partner Offers Catalog & Eligibility Engine

### Goals

- Create partner offers database table
- Build eligibility calculator (moved from old Story 6)
- Match offers to users based on eligibility requirements
- Implement CLI CRUD tools for managing offers
- Build UI for admins to VIEW offers (editing requires CLI)
- Filter offers based on eligibility and prevent harmful suggestions

### Key Considerations

- Split from old Story 6 (Assessment Engine Core) and old Story 8 (Partner Offers Catalog)
- Eligibility engine was removed from Phase 2 Story 6
- Uses eligibility metrics calculated from signals
- Partner offers stored server-side in database
- Placeholder/demo data initially
- CLI tooling needs environment checks to prevent accidental production modifications
- Admins can view in admin dashboard, but editing requires CLI (UI editing in Next Steps)
- **Implemented LAST** because it depends on assessments storage (Story 15) and admin tools (Story 17)

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
- npm run offers:create <json-file> --confirm
- npm run offers:update <id> <json-file> --confirm
- npm run offers:delete <id> --confirm
- npm run offers:activate <id>
- npm run offers:deactivate <id>

Environment checks:
- Require --env=production flag for prod database
- Default to development database
- Require --confirm flag for destructive operations (from Story 17)
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
- [ ] CLI tools for CRUD operations working with `--confirm` flags
- [ ] Environment checks prevent accidental prod modifications
- [ ] Admin UI displays offers (view only)
- [ ] Offers attached to insights based on persona and eligibility

---

## Phase 4 Completion Checklist

### Story 12: Authentication & Account Creation

- [ ] Supabase Auth integrated
- [ ] Signup/login flows working
- [ ] Users table created with consent fields
- [ ] Protected routes redirect to login
- [ ] Session persists across refreshes

### Story 15: Assessment Storage & Archival

- [ ] Assessments table created with `is_archived` and flagging fields
- [ ] Assessment storage working
- [ ] Previous assessments archived (same table)
- [ ] User can delete account and ALL data (hard delete CASCADE)
- [ ] NO raw financial data stored
- [ ] Archived assessments viewable by admins only

### Story 14: Consent Management

- [ ] Consent tracked in users.consent_status field
- [ ] Consent requested after signup
- [ ] Server checks consent before operations
- [ ] User can revoke consent
- [ ] Revoke consent prompts to delete data
- [ ] Revocation blocks operations
- [ ] Separate revoke and delete actions

### Story 16: Admin Dashboard UI

- [ ] Admin dashboard displays recent insights (paginated)
- [ ] Separate "Flagged Insights" section
- [ ] Flagged assessments highlighted in main list
- [ ] Admin can view current + archived assessments
- [ ] Admin can flag/unflag entire assessments
- [ ] Username/email masked
- [ ] User metadata displayed (consent status, admin status)
- [ ] Decision tree and signals displayed
- [ ] Protected admin-only access

### Story 17: CLI Admin Tools

- [ ] CLI can promote/demote admins with `--confirm` flag
- [ ] CLI can manage users
- [ ] CLI can delete users with `--confirm` flag (CASCADE)
- [ ] CLI can manage offers with `--confirm` flags
- [ ] Destructive operations require `--confirm`
- [ ] Environment checks working
- [ ] Database operations via CLI

### Story 13: Partner Offers Catalog & Eligibility Engine

- [ ] Partner offers table created
- [ ] Eligibility metrics calculator working
- [ ] Eligibility matcher filters offers
- [ ] CLI CRUD tools working with safety checks
- [ ] Admin UI displays offers (view only)
- [ ] Offers attached to insights

### Integration Test

- [ ] Full flow: Signup → Consent → Plaid → Assessment → Storage
- [ ] Admin can view stored assessment (current + archived)
- [ ] User can revoke consent (prompts to delete data)
- [ ] User can delete account and all data (hard delete CASCADE)
- [ ] Consent revocation blocks operations
- [ ] Partner offers filtered by eligibility
- [ ] Admin can flag/unflag assessments
- [ ] Flagged assessments appear in both lists
- [ ] Both UI and CLI work for all features

---

## Next Steps

After completing Phase 4, move to Phase 5: AI Integration (Stories 18-19)
See `phase-5.md` for detailed implementation guide.
