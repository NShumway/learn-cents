# 🧭 Product Requirements Document (PRD)

**Product Name: Learning Cents**  
**Author: Nate Shumway**  
**Date: 11/03/2025**  
**Version: 0.0.0.1**  
**Status: Draft**

---

## 1. Problem Statement

> Banks generate massive transaction data through Plaid integrations but struggle to transform it into actionable customer insights without crossing into regulated financial advice. Use this data to help users make smart financial decisions, including offering the choice of partner services.

---

## 2. Summary

> Learning Cents is an explainable, consent-aware financial education platform that leverages Plaid-style transaction data into personalized financial learning experiences. After the user consents, Learning Cents detects behavioral patterns and delivers tailored, easy-to-understand financial education content while obeying financial advice regulations. Admin access provides human oversight with full decision traceability and overridability while preserving users' anonymity. Initial suggestions are generated locally, while the user can ask follow-up questions that are processed via cloud AI. All communications respect clear guardrails around tone and product eligibility.

---

## 3. Goals

- Transform transaction data into actionable behavioral insights through algorithmic pattern detection (subscriptions, savings, credit utilization, income stability, etc.)
- Deliver personalized, explainable financial education with 100% of recommendations including plain-language rationales citing specific data points
- Build trust through robust consent management, product eligibility filtering, and non-judgmental tone guardrails that prevent financial advice overreach
- Enable human oversight with a full-featured admin view providing decision traceability and recommendation override workflows
- Achieve high system performance with <1 second recommendation generation while maintaining 100% coverage (all users assigned persona with ≥3 detected behaviors)

---

## 4. User Personas

| Persona                | Description                                                                            | Key Needs                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Developers**         | Engineers building, deploying, and maintaining the Learning Cents platform             | One-line build command (single bat/script file) that sets up entire app with all dependencies; CLI tools for quick iteration; comprehensive testing suite; clear modular architecture; deterministic behavior for debugging; local development environment without external dependencies                                       |
| **Admins (Operators)** | Internal operators providing human oversight of the recommendation system              | Dashboard to view anonymized user data and detected behavioral signals; ability to review, override, and flag recommendations; access to decision traces explaining why recommendations were made; tools to ensure consent compliance and eligibility rules are followed                                                       |
| **End Users**          | Customers who connect their Plaid accounts to receive personalized financial education | Simple consent flow, including opt-out; clear privacy controls; personalized financial education content with easy-to-understand explanations; non-judgmental, empowering tone; ability to revoke consent at any time; transparency about how their data is being used; ability to ask follow-up questions and discuss with AI |

---

## 5. Functional Requirements

**Core Features:**

- **Synthetic Data Generation**: CLI tool only - Generate 50-100 synthetic users with Plaid-style data (accounts, transactions, liabilities) representing diverse financial situations without real PII for testing and evaluation purposes
- **Data Import**: End users connect via Plaid Link for OAuth-based connection to financial institutions, retrieving transaction history, account balances, liabilities, and income data. JSON/CSV file upload available for development, testing, and demo purposes only (not practical for real end users due to lack of standardized bank export formats)
- **Behavioral Signal Detection**: Client-side browser processing for single users; also available as CLI tool for batch testing (50-100 users). Compute signals per 30-day and 180-day windows for subscriptions (recurring merchants, spend patterns), savings (net inflow, growth rate, emergency fund coverage), credit (utilization, minimum payments, overdue status), income stability (payroll detection, payment frequency, cash-flow buffer), and overdraft patterns (negative balances, overdraft/NSF fees)
- **Persona Assignment**: Assign each user to one or more of 7 personas based on detected behaviors: (1) High Utilization, (2) Variable Income Budgeter, (3) Subscription-Heavy, (4) Savings Builder, (5) Frequent Overdrafts (negative balances, overdraft/NSF fees detected), (6) Blank Slate (minimal transaction data, new to financial management), (7) General (catch-all for users not matching specific personas, receives generic insights and partner offers). Generate insights for ALL matching personas
- **Assessment Engine**: Create one assessment per user containing priority insight (highest-priority persona) and additional insights (other matching personas). Store underlying data structures for each insight (e.g., subscription arrays with merchant name, amount, cadence) plus aggregated metrics relevant to partner offer eligibility (e.g., total credit utilization, total interest paid, emergency fund coverage). Rendering functions in codebase transform data structures into user-display text and AI-context formatting. Generate 3-5 education items and 1-3 partner offers per insight with data-driven rationales. Server stores only underlying data structures, eligibility metrics, and metadata, not rendered text
- **Consent Management**: Immediately after account creation, request explicit consent and store server-side. Check consent status server-side before any processing operation. Allow consent revocation at any time, blocking all future operations
- **Data Archival**: When user imports new financial data, previous assessment automatically archived server-side. Most recent assessment is always active (no archived flag needed). Archived assessments retained for potential future analysis but not displayed to users
- **Data Deletion**: Provide user-accessible button to flush all data from server including active and archived assessments, AI chat history, and any processed data for complete privacy control
- **Partner Offers Catalog**: Server-side database of partner offers containing: targeted personas, priority ranking per persona, eligibility requirements (income thresholds, credit utilization, existing accounts, etc.), active date range, offer name, and offer pitch (description sent directly to user). Use placeholder/demo data initially. CLI CRUD tooling for offer management with environment checks to prevent accidental production modifications
- **Eligibility Guardrails**: Filter partner offers based on user eligibility requirements from catalog and prevent harmful suggestions (no payday loans or predatory products)
- **Tone Enforcement**: AI integration with function calling to enforce guardrails around tone, legal compliance (no regulated financial advice), and product eligibility before responses are delivered
- **Operator View**: Admins see everything users see (including specific financial numbers in assessments and decision trees) but with username/email masked and internal account ID shown. Can filter to view flagged AI responses for developer review and guardrail refinement
- **AI Follow-up Chat**: Users can ask follow-up questions after viewing assessment. System sends assessment data structure (not raw financial data) plus chat history to AI with function-calling guardrails. Chat history preserved server-side with assessment for resume capability and admin review
- **Evaluation Harness**: CLI tool measures coverage, explainability, relevance, latency (<1s assessment generation, <2s AI responses), and fairness with JSON/CSV metrics output and summary reports

**User Flows / Interactions:**

- **Developer Flow**: Run single build command → All dependencies installed → Run tests → Start local development server → Use CLI tool for synthetic data generation and batch testing (50-100 users) → Run evaluation metrics
- **End User Flow**: Create account → Grant consent (stored server-side) → Connect financial accounts via Plaid Link OAuth → Browser processes Plaid data client-side and generates assessment with decision trees → Only assessment and decision trees sent to server (raw financial data flushed immediately after processing) → User views priority insight first, with button to reveal additional insights in chat window → User asks follow-up questions via AI chat (with guardrails) → User can reconnect Plaid to refresh data (archives previous assessment) → User can flush all server data at any time for privacy
- **Admin Flow**: Access operator dashboard → Select user by internal account ID (username/email masked) → View assessment (priority insight + additional insights), decision trees, and specific financial signals as user sees them → Review AI chat history → Flag problematic AI responses for developer review → Monitor system metrics and compliance

**Edge Cases:**

- Users with insufficient transaction history (<90 days) should receive default educational content until enough data is available
- Users matching multiple persona criteria generate insights for ALL matching personas. Priority insight determined by persona priority order (High Utilization > Frequent Overdrafts > Variable Income > Subscription-Heavy > Savings Builder > Blank Slate > General), additional insights available via button
- Frequent Overdrafts persona detects negative balances and overdraft/NSF fees in transaction history
- Blank Slate persona targets users with minimal transaction data (<30 transactions in 180 days) to provide foundational financial education
- General persona is catch-all for users not matching other personas; provides generic insights and partner offers; ensures 100% persona coverage
- Users who revoke consent must have all processing operations immediately blocked server-side
- Users who flush data have all active and archived assessments, chat history, and any processed data permanently deleted
- Users who reconnect Plaid have previous assessment automatically archived (not deleted unless user initiates flush)
- Browser calculation is trusted; no server-side verification of pattern detection since raw financial data never reaches server
- Users with no detected behaviors (edge case for coverage metric) should be flagged for manual review
- Partner offers for products users already have must be filtered out by eligibility checks
- Transaction data with missing or malformed fields should be handled gracefully without breaking signal detection
- JSON/CSV file upload (dev/testing feature): Files must be parseable into expected Plaid schema format; validation errors should provide clear feedback

---

## 6. Non-Functional Requirements

- **Performance:**
  - Browser-based assessment generation must complete in <1 second for single user
  - AI follow-up responses must complete in <2 seconds
  - CLI tool supports batch processing of 50-100 synthetic users for testing and evaluation
  - System must run efficiently on a laptop without external dependencies
  - Deterministic behavior with seeded randomness for reproducible testing in CLI tool

- **Security:**
  - No real PII in synthetic data generation (use fake names, masked account numbers)
  - Client-side processing ensures raw financial data (local JSON/CSV files) never leaves user's browser
  - Local financial data flushed from browser immediately after assessment generation
  - Only assessments (with insights), decision trees, and AI chat history stored server-side (never raw financial data)
  - Anonymized data presentation in operator view (username/email masked, internal account ID shown)
  - Consent status tracked and enforced server-side before all processing operations
  - User-initiated data flush permanently deletes all server-side data (active and archived assessments, chat history)
  - Login cookies are the only persistent browser data

- **Scalability:**
  - Modular architecture supporting independent scaling of components (data import, browser-side processing, server-side storage, AI integration, operator UI, CLI evaluation)
  - Shared function library callable from both browser (frontend) and Node.js (CLI tool)
  - Server stores: user accounts, consent status, assessments with underlying data structures (priority insight + additional insights), decision trees, AI chat history, and archived assessments
  - Clear separation of concerns to allow future distributed deployment

- **Reliability:**
  - Thorough unit/integration tests passing
  - Graceful handling of missing or malformed transaction data
  - Saved decision logs for all assessments enabling audit trails

- **Accessibility / UX:**
  - Plain-language explanations with no financial jargon
  - Clear, concise rationales citing specific data points
  - Empowering, non-judgmental tone throughout all user-facing content
  - Simple consent flows with transparency about data usage
  - Responsive operator dashboard for efficient review workflows

- **Compliance:**
  - All insights include disclaimer: "This is educational content, not financial advice. Consult a licensed advisor for personalized guidance."
  - No regulated financial advice provided
  - Consent required before any data processing and can be withdrawn
  - Eligibility checks prevent inappropriate product suggestions
  - Full decision traceability for regulatory audit support

---

## 7. Technical Considerations

- **Platforms / Environments:**
  - **Frontend**: React + TypeScript with Vite build tool
  - **Backend**: Node.js + TypeScript with Vercel API routes
  - **Database**: Supabase (managed PostgreSQL)
  - **Authentication**: Supabase Auth
  - **Deployment**: Vercel (frontend + API routes), Supabase (database + auth)
  - **Development**: Local development environment with one-line build script
  - **CI/CD**: GitHub Actions recommended - automatic deployment to Vercel on push to main branch, run tests before deployment, Prisma migrations on deployment. Vercel provides built-in GitHub integration for seamless deployments

- **APIs / Integrations:**
  - **Plaid API**: Primary data source via Plaid Link for OAuth-based connection to financial institutions. Retrieves transactions, account balances, liabilities, and income data
  - **Vercel AI SDK**: AI integration with OpenAI GPT-4, function calling for guardrails (tone, legal compliance, eligibility)
  - **Supabase Client**: Database access and authentication from frontend
  - **Supabase Admin SDK**: Server-side database operations and user management
  - **Browser File API**: File picker for JSON/CSV upload (development, testing, and demo use only)
  - **Papa Parse**: CSV parsing in browser for dev/test file uploads

- **Dependencies:**
  - **Frontend**: React, TypeScript, Vite, Tailwind CSS, Vercel AI SDK (`ai` package with `useChat` hook), Plaid Link SDK, Papa Parse, Supabase JS client
  - **Backend**: Node.js, TypeScript, Prisma ORM, Vercel AI SDK, Supabase JS admin
  - **Shared Library**: TypeScript functions for behavioral signal detection, persona assignment, and recommendation generation (callable from both browser and Node.js CLI)
  - **CLI Tool**: Commander.js for argument parsing, shared TypeScript functions, Prisma for database access
  - **Testing**: Vitest (unit/integration), React Testing Library (component tests)
  - **Dev Tools**: ESLint, Prettier, TypeScript compiler

- **Technical Constraints:**
  - Client-side processing limited to single-user analysis (performance constraint)
  - Raw financial data must never reach server (security constraint)
  - Assessment generation must complete <1 second in browser (performance constraint)
  - AI follow-up responses must complete <2 seconds (performance constraint)
  - Shared functions must be environment-agnostic (work in both browser and Node.js)
  - AI guardrails enforced via function calling before response delivery (compliance constraint)
  - File formats limited to JSON and CSV with defined schema (compatibility constraint)

- **Data Requirements:**
  - **User Data (Supabase)**: Account information, email, consent status, internal account ID, admin role flag
  - **Assessment Data (Supabase)**: One assessment per user containing priority insight and additional insights with underlying data structures (e.g., subscription arrays with merchant/amount/cadence), aggregated eligibility metrics (total credit utilization, total interest paid, emergency fund coverage, income levels, existing accounts), decision trees, timestamp. Most recent assessment is active; older assessments automatically archived. Eligibility metrics stored to ensure confident partner offer suggestions
  - **Partner Offers Catalog (Supabase)**: Server-side table containing: offer_id, offer_name, offer_pitch (user-facing description), targeted_personas (array), priority_per_persona (ranking), eligibility_requirements (JSON with thresholds), active_date_start, active_date_end, created_at, updated_at
  - **AI Chat History (Supabase)**: User questions, AI responses, timestamps, associated assessment ID
  - **Financial Data Sources**: Plaid API for end-user data retrieval (transactions, accounts, liabilities, income). JSON/CSV files matching Plaid schema available for development, testing, and demos only (processed client-side in browser). All financial data processed client-side and flushed immediately; never stored server-side
  - **Rendering Functions**: Per-persona functions stored in codebase (not database) to render insights from underlying data structures for user display and AI context
  - **Synthetic Data Generation**: CLI tool generates 50-100 test users on-demand for evaluation (not stored long-term)

---

## 8. Scope Limitations

- **No Multi-User or Household Accounts**: Single-user accounts only. No joint finances, household budgeting, or sharing assessments between users
- **No Financial Product Transactions**: Platform provides educational content and partner offer suggestions only. No ability to apply for products, open accounts, or execute financial transactions within the app
- **No Historical Trend Analysis**: System analyzes current 30-day and 180-day windows only. No year-over-year comparisons, multi-year trend visualization, or predictive forecasting
- **No Mobile Native Apps**: Web-based responsive design only. No iOS/Android native applications in initial scope
- **No Investment/Portfolio Analysis**: Focus limited to transaction accounts (checking, savings, credit cards, basic liabilities). No stock portfolios, retirement accounts, or investment performance analysis
- **No Credit Score Analysis**: Plaid does not provide credit scores. System cannot analyze credit score trends or provide credit-building recommendations based on score
- **No Bill Pay or Account Management**: Educational platform only. No bill payment, account linking for transfers, fund movement, or direct account management features
- **No Multi-Currency Support**: USD only. No currency conversion or international transaction analysis
- **No Export/Reporting Features**: Users can view assessments and chat history in-app only. No PDF export, email reports, or downloadable summaries (beyond what admin/dev tools provide for evaluation)
- **No Custom Persona Creation**: Users cannot create or modify the 7 predefined personas. System uses fixed behavioral criteria determined by development team
- **Limited Partner Offer Catalog**: Small curated set of partner offers for demonstration and validation. Not a comprehensive marketplace of financial products
- **No Automated Scheduling**: No recurring Plaid data refreshes, scheduled reassessments, or automated reminders. User must manually trigger new assessments by reconnecting Plaid or uploading new data
- **Strict Merchant Name Matching**: Subscription detection uses case-insensitive strict name matching only. No fuzzy matching or merchant name normalization. Variations in merchant names may not be detected as same merchant
- **Chromium Browser Only**: Application tested and supported on Chromium-based browsers (Chrome, Edge, Brave) only. Other browsers (Firefox, Safari) not officially supported in MVP
- **United States Only**: This application is designed for use in the United States only. Financial regulations, product offerings, and compliance requirements vary by country. Using this application outside the United States may violate local financial services regulations or data privacy laws. All partner offers and educational content are US-focused

---

## 9. Risks

| Risk                                       | Impact                                                                                                                                                                                                 | Mitigation                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plaid API Rate Limits or Downtime**      | Users cannot connect accounts or refresh data, blocking primary user flow                                                                                                                              | Use Plaid Sandbox environment for testing and demos; setup instructions include connecting paid Plaid account for production; display clear error messages; monitor Plaid status page; graceful failure with retry prompts                                                                                                                                                                     |
| **AI Guardrail Bypass**                    | AI provides regulated financial advice, inappropriate tone, or ineligible product recommendations, exposing platform to legal liability                                                                | Implement function calling validation before response delivery; extensive testing of edge cases; clear disclaimers on every insight and AI message; admin review after-the-fact with ability to flag problematic responses for developer review and guardrail refinement                                                                                                                       |
| **Client-Side Processing Performance**     | Assessment generation exceeds 1-second target for users with extensive transaction history. Plaid returns up to 24 months of data with no server-side filtering; users could have 10,000+ transactions | Process only last 180 days of transactions client-side (ignore older data from Plaid response); implement Web Workers for background processing to keep UI responsive; optimize algorithms with indexing; progressive loading for perceived speed; add loading indicators                                                                                                                      |
| **Data Privacy Breach**                    | Raw financial data accidentally stored server-side or exposed through logs/errors, violating core security promise                                                                                     | Strict code reviews for any server-side data handling; client-side processing architecture ensures financial data never reaches server; protection against XSS attacks; comprehensive logging audit to exclude financial data; never log Plaid responses server-side                                                                                                                           |
| **Inaccurate Behavioral Signal Detection** | Pattern detection algorithms produce false positives (e.g., flagging one-time purchases as subscriptions), leading to irrelevant insights and user distrust                                            | Extensive testing with diverse synthetic datasets; conservative thresholds for pattern matching (require ≥3 occurrences); validate against 100 synthetic users in evaluation; admin oversight to flag incorrect patterns for algorithm refinement                                                                                                                                              |
| **Persona Assignment Inconsistency**       | Unclear decision logic for priority insight selection causing confusion for admins and users                                                                                                           | Build and document clear decision tree with explicit prioritization hierarchy (High Utilization > Variable Income > Subscription-Heavy > Savings Builder > Custom); provide secondary insights for users matching multiple personas; decision tree documentation accessible to admins for reference; validate against synthetic user dataset                                                   |
| **Supabase Service Disruption**            | Database or auth outage prevents consent verification, blocking all data processing operations                                                                                                         | Implement retry logic with exponential backoff; graceful failure (do NOT generate assessments without server connection since consent check required); clear error messaging explaining service unavailability; monitor Supabase status; user can retry when service restored                                                                                                                  |
| **AI Response Latency**                    | GPT-4 API calls take longer than 2-second target during high load or OpenAI outages, degrading chat experience                                                                                         | Implement streaming responses via Vercel AI SDK for perceived speed; display loading spinner during processing; long timeout (30s+) to handle slower responses without premature failure; clear error messaging if timeout reached; load testing before launch                                                                                                                                 |
| **Processing Without Consent**             | System processes user financial data before consent verified or after consent revoked, violating privacy promise and potentially regulations                                                           | CRITICAL: Server-side consent check required before ANY data processing operation; consent status fetched from Supabase before Plaid connection allowed; consent verification before assessment generation; consent revocation immediately blocks all processing; automated testing to verify consent checks are in place; clear user messaging when operations blocked due to missing consent |
| **Regulatory Compliance Uncertainty**      | Unclear whether platform constitutes "financial advice" despite disclaimers, risking regulatory action                                                                                                 | Legal review of all user-facing content before launch; consult with fintech compliance expert; research state-by-state financial advice regulations; ensure all insights are purely educational; prominent disclaimers on every insight and chat message; admin review of all content                                                                                                          |

---

✅ **Next Steps / Open Questions (Post-MVP):**

- **Admin UI for Partner Offer Editing**: Build UI for admins to create, edit, and delete partner offers including eligibility requirements without code changes. Currently partner offers managed via CLI only.
- **User Feedback Mechanism**: Consider adding feature for users to report inaccurate behavioral signal detection (e.g., "This isn't a subscription" button). Would improve algorithm refinement beyond admin oversight alone.
- **Automated Plaid Refresh Prompts**: Consider prompting users to refresh Plaid connection after X days (e.g., 30, 60, 90 days) to ensure insights remain current. Balance between data freshness and user friction.
- **Admin Management System**: MVP uses CLI to promote users to admin. Future: consider invite system, separate admin signup flow, or approval workflow with role-based permissions.
- **Real Partner Integrations**: Transition from placeholder offers to actual partnerships/affiliate agreements. Consider API integrations for real-time offer availability and application tracking.
- **Multi-User / Household Accounts**: Currently single-user only. Future consideration: joint finances, household budgeting, sharing insights between family members.
- **Historical Trend Analysis**: Currently analyzes 30-day and 180-day windows. Future: year-over-year comparisons, multi-year trends, predictive forecasting.
- **Mobile Native Apps**: Currently web-only. Consider iOS/Android native apps for better mobile experience and push notifications.
- **Export/Reporting**: Consider PDF export, email reports, or downloadable assessment summaries for users who want records.
- **Investment/Portfolio Analysis**: Expand beyond transaction accounts to include stocks, retirement accounts, investment performance (requires additional Plaid products or integrations).
