# Phase 3: User Interface

**Stories 8-11** - User-facing application for assessment display and Plaid integration (Sandbox only, no authentication yet).

---

## Story 8: Frontend Setup

### Goals
- Set up React + TypeScript + Vite frontend
- Configure Tailwind CSS for styling
- Create basic routing structure
- Build component library foundation
- **NO AUTHENTICATION YET** - authentication moves to Phase 4

### File Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Root component with routing
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Spinner.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Layout.tsx
├── pages/
│   ├── Home.tsx                # Landing page
│   ├── Assessment.tsx          # Assessment display page
│   └── NotFound.tsx
├── lib/
│   └── utils.ts                # Utility functions
└── styles/
    └── index.css               # Global styles + Tailwind imports

public/
└── index.html

vite.config.ts
tailwind.config.js
tsconfig.json
package.json
```

### Implementation Details

#### 1. Project Setup

```bash
# Create Vite project
npm create vite@latest frontend -- --template react-ts

cd frontend

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional dependencies
npm install react-router-dom
```

#### 2. Tailwind Configuration (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

#### 3. Global Styles (src/styles/index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans antialiased;
  }
}
```

#### 4. App Router (src/App.tsx)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Assessment from './pages/Assessment';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

#### 5. Layout Component (src/components/layout/Layout.tsx)

```tsx
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

#### 6. Home Page Stub (src/pages/Home.tsx)

```tsx
export default function Home() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Learning Cents</h1>
      <p className="text-lg text-gray-600 mb-8">
        Personalized financial education based on your transaction data
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-800">
          Frontend setup complete. Assessment display and Plaid integration coming in Stories 9-11.
        </p>
      </div>
    </div>
  );
}
```

### Acceptance Criteria

- [ ] Vite + React + TypeScript project created
- [ ] Tailwind CSS configured and working
- [ ] React Router setup with basic routes
- [ ] Layout component with header and footer
- [ ] Reusable UI components created (Button, Card, Input, Spinner)
- [ ] Home page renders
- [ ] Development server runs (`npm run dev`)
- [ ] Build succeeds (`npm run build`)
- [ ] NO authentication implemented (deferred to Phase 4)

### Testing

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Story 9: Assessment Display UI

### Goals
- Display assessment with priority insight and additional insights
- Render persona-specific education content
- Show decision tree explaining persona assignment
- Use rendering functions from Phase 2 to display insights
- **Client-side only** - no server integration yet

### File Structure

```
src/
├── components/
│   ├── assessment/
│   │   ├── InsightCard.tsx          # Display single insight
│   │   ├── EducationList.tsx        # Display education items
│   │   ├── DecisionTree.tsx         # Display decision reasoning
│   │   └── AssessmentSummary.tsx    # Overall assessment display
│   └── ui/
│       └── Accordion.tsx            # Collapsible sections
├── pages/
│   └── Assessment.tsx               # Assessment display page
└── lib/
    └── mockAssessment.ts            # Mock assessment data for UI development
```

### Implementation Details

#### 1. Mock Assessment Data (src/lib/mockAssessment.ts)

```typescript
import type { Assessment } from '../../../recommend/types';

// Mock assessment for UI development
export const mockAssessment: Assessment = {
  priorityInsight: {
    personaType: 'High Utilization',
    priority: 1,
    underlyingData: {
      cards: [
        {
          mask: '4532',
          utilization: 68,
          balance: 3400,
          limit: 5000,
          interest: 57.50
        },
        {
          mask: '1234',
          utilization: 42,
          balance: 2100,
          limit: 5000,
          interest: 35.20
        }
      ]
    },
    renderedForUser: 'Your credit card usage is high...',
    educationItems: [
      {
        title: 'Understanding Credit Utilization',
        description: 'Learn how credit card utilization affects your credit score and financial health.'
      },
      {
        title: 'Debt Paydown Strategies',
        description: 'Strategies for paying down credit card debt efficiently, including avalanche and snowball methods.'
      },
      {
        title: 'Setting Up Autopay',
        description: 'How to set up automatic payments to avoid missed payments and late fees.'
      }
    ]
  },
  additionalInsights: [
    {
      personaType: 'Subscription-Heavy',
      priority: 4,
      underlyingData: {
        subscriptions: [
          { merchant: 'Netflix', amount: 15.99, cadence: 'monthly', lastChargeDate: '2024-03-15', count: 6 },
          { merchant: 'Spotify', amount: 9.99, cadence: 'monthly', lastChargeDate: '2024-03-10', count: 6 }
        ],
        totalMonthlySpend: 2400,
        subscriptionShareOfSpend: 12
      },
      renderedForUser: 'You have multiple recurring subscriptions...',
      educationItems: [
        {
          title: 'Audit Active Subscriptions',
          description: 'Review all your recurring charges and cancel unused services.'
        }
      ]
    }
  ],
  decisionTree: {
    signalsDetected: ['credit-high-util', 'subscriptions'],
    personasConsidered: [
      {
        persona: 'High Utilization',
        matched: true,
        criteria: ['Utilization ≥50%', 'Interest charges detected']
      },
      {
        persona: 'Subscription-Heavy',
        matched: true,
        criteria: ['≥3 recurring merchants', 'Subscription share ≥10%']
      },
      {
        persona: 'Savings Builder',
        matched: false,
        criteria: ['Growth rate <2%']
      }
    ],
    priorityReasoning: 'High Utilization (priority 1) matched first'
  }
};
```

#### 2. Insight Card Component (src/components/assessment/InsightCard.tsx)

```tsx
import type { Insight } from '../../../../recommend/types';

interface InsightCardProps {
  insight: Insight;
  isPriority?: boolean;
}

export default function InsightCard({ insight, isPriority }: InsightCardProps) {
  return (
    <div className={`border rounded-lg p-6 ${isPriority ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      {isPriority && (
        <div className="text-xs font-semibold text-blue-600 uppercase mb-2">
          Priority Insight
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">{insight.personaType}</h2>

      <div className="prose max-w-none mb-6">
        <p>{insight.renderedForUser}</p>
      </div>

      <EducationList items={insight.educationItems} />
    </div>
  );
}
```

#### 3. Education List Component (src/components/assessment/EducationList.tsx)

```tsx
import type { EducationItem } from '../../../../recommend/types';

interface EducationListProps {
  items: EducationItem[];
}

export default function EducationList({ items }: EducationListProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Learn More</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### 4. Decision Tree Component (src/components/assessment/DecisionTree.tsx)

```tsx
import type { DecisionTree } from '../../../../recommend/types';

interface DecisionTreeProps {
  tree: DecisionTree;
}

export default function DecisionTreeComponent({ tree }: DecisionTreeProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">How We Determined Your Insights</h3>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Signals Detected</div>
        <div className="flex flex-wrap gap-2">
          {tree.signalsDetected.map((signal, index) => (
            <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {signal}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Personas Considered</div>
        <div className="space-y-2">
          {tree.personasConsidered.map((persona, index) => (
            <div key={index} className={`p-3 rounded ${persona.matched ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${persona.matched ? 'text-blue-900' : 'text-gray-600'}`}>
                  {persona.persona}
                </span>
                {persona.matched && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Matched</span>
                )}
              </div>
              <div className="text-xs text-gray-600">
                {persona.criteria.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="text-sm font-medium text-yellow-900 mb-1">Priority Reasoning</div>
        <div className="text-sm text-yellow-800">{tree.priorityReasoning}</div>
      </div>
    </div>
  );
}
```

#### 5. Assessment Page (src/pages/Assessment.tsx)

```tsx
import { useState } from 'react';
import InsightCard from '../components/assessment/InsightCard';
import DecisionTreeComponent from '../components/assessment/DecisionTree';
import { mockAssessment } from '../lib/mockAssessment';

export default function Assessment() {
  const [showAdditional, setShowAdditional] = useState(false);
  const assessment = mockAssessment;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Your Financial Assessment</h1>
      <p className="text-gray-600 mb-8">
        Personalized insights based on your transaction data
      </p>

      <div className="mb-8">
        <InsightCard insight={assessment.priorityInsight} isPriority />
      </div>

      {assessment.additionalInsights.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowAdditional(!showAdditional)}
            className="w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-left font-medium flex items-center justify-between"
          >
            <span>Additional Insights ({assessment.additionalInsights.length})</span>
            <span>{showAdditional ? '▼' : '▶'}</span>
          </button>

          {showAdditional && (
            <div className="mt-4 space-y-4">
              {assessment.additionalInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <DecisionTreeComponent tree={assessment.decisionTree} />
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <strong>Disclaimer:</strong> This is educational content, not financial advice.
        Consult a licensed advisor for personalized guidance.
      </div>
    </div>
  );
}
```

### Acceptance Criteria

- [ ] Assessment display page renders priority insight
- [ ] Additional insights hidden behind expand/collapse button
- [ ] Education items displayed for each insight
- [ ] Decision tree shows signals detected and personas considered
- [ ] Disclaimer displayed prominently
- [ ] UI is responsive and works on mobile
- [ ] Uses mock data from mockAssessment.ts
- [ ] All components properly typed with TypeScript

### Testing

- Manually test all UI components with mock data
- Verify responsive design on different screen sizes
- Test expand/collapse functionality for additional insights
- Verify decision tree displays correctly

---

## Story 10: Plaid Integration (Sandbox)

### Goals
- Integrate Plaid Link for OAuth-based account connection
- **SANDBOX MODE ONLY** - no production credentials yet
- Fetch transaction data from Plaid Sandbox
- Process data client-side using Phase 2 functions
- Generate assessment from real Plaid data structure

**Note**: This story uses Plaid Sandbox with test credentials. Production Plaid setup happens in Phase 4.

### File Structure

```
src/
├── lib/
│   ├── plaid.ts                    # Plaid Link integration
│   ├── assessmentGenerator.ts      # Client-side assessment generation
│   └── types.ts                    # Type definitions
└── config/
    └── plaid.ts                    # Plaid configuration (sandbox)
```

### Implementation Details

#### 1. Install Plaid Link SDK

```bash
npm install react-plaid-link
```

#### 2. Plaid Configuration (src/config/plaid.ts)

```typescript
/**
 * Plaid configuration for SANDBOX mode
 *
 * IMPORTANT: This uses Plaid Sandbox for development/testing.
 * Production Plaid setup happens in Phase 4.
 */

export const PLAID_CONFIG = {
  clientName: 'Learning Cents',
  env: 'sandbox' as const,
  products: ['transactions'] as const,
  countryCodes: ['US'] as const,
  language: 'en' as const,
};

// Sandbox link token (will be generated server-side in Phase 4)
// For now, this is a placeholder - you'll need to generate a real sandbox token
export const SANDBOX_LINK_TOKEN = process.env.VITE_PLAID_SANDBOX_LINK_TOKEN || '';
```

#### 3. Assessment Generator (src/lib/assessmentGenerator.ts)

```typescript
/**
 * Client-side assessment generation
 * Uses Phase 2 functions to process Plaid data in browser
 */

import { detectAllSignals } from '../../../features/signals';
import { assignPersonas } from '../../../personas';
import { buildAssessment } from '../../../recommend/assessmentBuilder';
import type { PlaidAccount, PlaidTransaction, PlaidLiability } from '../../../scripts/lib/types/plaidData';
import type { Assessment } from '../../../recommend/types';

export interface PlaidData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  liabilities: PlaidLiability[];
}

/**
 * Generate assessment from Plaid data (client-side)
 *
 * Pipeline:
 * 1. Detect signals
 * 2. Assign personas
 * 3. Build assessment
 * 4. FLUSH raw financial data
 * 5. Return only assessment
 */
export async function generateAssessmentFromPlaid(
  plaidData: PlaidData,
  onProgress?: (stage: string, percent: number) => void
): Promise<Assessment> {
  try {
    // Stage 1: Detect signals
    onProgress?.('Analyzing patterns', 30);
    const signals = await detectAllSignals(plaidData);
    onProgress?.('Patterns detected', 60);

    // Stage 2: Assign personas
    onProgress?.('Identifying insights', 70);
    const personas = assignPersonas(signals);
    onProgress?.('Insights identified', 80);

    // Stage 3: Build assessment
    onProgress?.('Generating recommendations', 85);
    const assessment = await buildAssessment(personas, signals);
    onProgress?.('Assessment complete', 95);

    // Stage 4: FLUSH raw data
    plaidData.accounts = [];
    plaidData.transactions = [];
    plaidData.liabilities = [];

    onProgress?.('Finalizing', 100);

    return assessment;

  } catch (error) {
    console.error('Assessment generation failed:', error);
    throw error;
  }
}
```

#### 4. Plaid Link Integration (src/lib/plaid.ts)

```typescript
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';

/**
 * Plaid Link hook for OAuth account connection
 * SANDBOX MODE for Phase 3 - production setup in Phase 4
 */
export function usePlaidConnection(onSuccess: PlaidLinkOnSuccess) {
  // In Phase 4, linkToken will come from server
  // For now, using environment variable for sandbox
  const linkToken = process.env.VITE_PLAID_SANDBOX_LINK_TOKEN || '';

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return { open, ready };
}

/**
 * Exchange public token for access token
 * STUB - will be implemented server-side in Phase 4
 */
export async function exchangePublicToken(publicToken: string): Promise<string> {
  // Phase 4: POST to server API route
  // Server exchanges public token for access token
  // For now, return mock access token
  console.log('Public token received:', publicToken);
  return 'mock-access-token-sandbox';
}

/**
 * Fetch transactions from Plaid
 * STUB - will be implemented server-side in Phase 4
 */
export async function fetchPlaidData(accessToken: string): Promise<PlaidData> {
  // Phase 4: POST to server API route with access token
  // Server fetches data from Plaid and returns to client
  // For now, return mock data
  console.log('Fetching data with access token:', accessToken);

  throw new Error('fetchPlaidData not yet implemented - use mock data for now');
}
```

### Acceptance Criteria

- [ ] Plaid Link SDK installed
- [ ] Plaid configuration set for Sandbox mode
- [ ] Assessment generator processes Plaid data client-side
- [ ] Assessment generator uses Phase 2 functions (detectAllSignals, assignPersonas, buildAssessment)
- [ ] Raw financial data flushed after processing
- [ ] Plaid Link integration stubs created
- [ ] All types properly defined
- [ ] **SANDBOX ONLY** - no production credentials

### Testing

- Test with Plaid Sandbox test credentials
- Verify client-side processing works
- Verify data flushing occurs
- Test error handling for missing data

**Note**: Full Plaid integration (server-side token exchange, data fetch) happens in Phase 4.

---

## Story 11: Plaid Connection UI

### Goals
- Build UI for connecting Plaid accounts
- Display loading states during processing
- Show assessment after successful connection
- Handle errors gracefully
- **Client-side only** - no server persistence yet

### File Structure

```
src/
├── components/
│   ├── plaid/
│   │   ├── PlaidConnectButton.tsx   # Button to open Plaid Link
│   │   ├── LoadingState.tsx         # Processing indicator
│   │   └── ErrorState.tsx           # Error display
│   └── assessment/
│       └── AssessmentDisplay.tsx    # Display generated assessment
├── pages/
│   ├── Home.tsx                     # Updated with Plaid connect flow
│   └── Assessment.tsx               # Updated to show real assessment
└── hooks/
    └── useAssessment.ts             # Assessment state management
```

### Implementation Details

#### 1. Plaid Connect Button (src/components/plaid/PlaidConnectButton.tsx)

```tsx
import { usePlaidConnection } from '../../lib/plaid';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';

interface PlaidConnectButtonProps {
  onSuccess: PlaidLinkOnSuccess;
  disabled?: boolean;
}

export default function PlaidConnectButton({ onSuccess, disabled }: PlaidConnectButtonProps) {
  const { open, ready } = usePlaidConnection(onSuccess);

  return (
    <button
      onClick={() => open()}
      disabled={!ready || disabled}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      {ready ? 'Connect Bank Account' : 'Loading...'}
    </button>
  );
}
```

#### 2. Loading State (src/components/plaid/LoadingState.tsx)

```tsx
interface LoadingStateProps {
  stage: string;
  percent: number;
}

export default function LoadingState({ stage, percent }: LoadingStateProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <div className="text-lg font-medium mb-2">{stage}</div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-600 mt-2">{percent}%</div>
    </div>
  );
}
```

#### 3. Error State (src/components/plaid/ErrorState.tsx)

```tsx
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-4 text-red-600">
        <svg className="inline-block w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}
```

#### 4. Assessment Hook (src/hooks/useAssessment.ts)

```tsx
import { useState } from 'react';
import type { Assessment } from '../../../../recommend/types';
import { generateAssessmentFromPlaid } from '../lib/assessmentGenerator';
import type { PlaidData } from '../lib/plaid';

interface UseAssessmentReturn {
  assessment: Assessment | null;
  loading: boolean;
  error: Error | null;
  progress: { stage: string; percent: number };
  generate: (plaidData: PlaidData) => Promise<void>;
  reset: () => void;
}

export function useAssessment(): UseAssessmentReturn {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState({ stage: '', percent: 0 });

  const generate = async (plaidData: PlaidData) => {
    setLoading(true);
    setError(null);
    setProgress({ stage: 'Starting', percent: 0 });

    try {
      const result = await generateAssessmentFromPlaid(
        plaidData,
        (stage, percent) => setProgress({ stage, percent })
      );

      setAssessment(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Assessment generation failed'));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAssessment(null);
    setError(null);
    setProgress({ stage: '', percent: 0 });
  };

  return { assessment, loading, error, progress, generate, reset };
}
```

#### 5. Updated Home Page (src/pages/Home.tsx)

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaidConnectButton from '../components/plaid/PlaidConnectButton';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';
import { exchangePublicToken, fetchPlaidData } from '../lib/plaid';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';

export default function Home() {
  const navigate = useNavigate();
  const { assessment, loading, error, progress, generate, reset } = useAssessment();

  const handlePlaidSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
    try {
      // Exchange public token for access token
      const accessToken = await exchangePublicToken(publicToken);

      // Fetch Plaid data
      const plaidData = await fetchPlaidData(accessToken);

      // Generate assessment client-side
      await generate(plaidData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      console.error('Plaid connection failed:', err);
    }
  };

  if (loading) {
    return <LoadingState stage={progress.stage} percent={progress.percent} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reset} />;
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">Learning Cents</h1>
      <p className="text-lg text-gray-600 mb-8">
        Get personalized financial education based on your transaction data
      </p>

      <div className="mb-8">
        <PlaidConnectButton onSuccess={handlePlaidSuccess} />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <strong>Note:</strong> This demo uses Plaid Sandbox mode.
        Use test credentials to connect.
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-left">
        <strong>Disclaimer:</strong> This is educational content, not financial advice.
        Consult a licensed advisor for personalized guidance.
      </div>
    </div>
  );
}
```

### Acceptance Criteria

- [ ] Plaid Connect button opens Plaid Link modal
- [ ] Loading state displays during assessment generation
- [ ] Progress indicator shows current stage and percentage
- [ ] Error state displays if something goes wrong
- [ ] Successful connection generates assessment
- [ ] Assessment displayed on Assessment page
- [ ] User can retry on error
- [ ] **NO SERVER PERSISTENCE** - client-side only
- [ ] Works with Plaid Sandbox test credentials

### Testing

- Test Plaid Link flow with Sandbox credentials
- Verify loading states display correctly
- Test error handling (simulate failures)
- Verify assessment displays after successful connection
- Test retry functionality

---

## Story 11.5: Architecture Cleanup & Synthetic Data UI

### Goals
- Migrate Express server to Vercel serverless functions
- Implement Plaid Link modal UI flow (replace sandbox bypass)
- Add UI file operations for synthetic data (generate/analyze)
- Add CLI file path flexibility for synthetic data tools
- Consolidate duplicate TypeScript types
- Update CLI tools quick reference documentation

### Key Considerations
- **Architecture migration**: Convert Express server (ui/app/main.ts) to Vercel serverless functions (/api routes)
- **Plaid Link modal**: Show test credentials on screen (username: `user_transactions_dynamic`, password: any value)
- **File operations**: Use browser File System Access API (no upload/download - direct file system access)
- **Single record processing**: UI only processes first user from multi-user files (CLI supports batch)
- **Type consolidation**: `scripts/lib/types/plaidData.ts` should reference `src/types/plaid.ts`

### File Structure

```
api/
├── plaid/
│   ├── create-link-token.ts      # POST /api/plaid/create-link-token
│   └── exchange-token.ts          # POST /api/plaid/exchange-token
│
ui/
├── pages/
│   ├── Home.tsx                    # Update: Use Plaid Link modal
│   └── SyntheticData.tsx           # NEW: Generate/analyze synthetic data
├── components/
│   └── synthetic/
│       ├── GenerateDataForm.tsx    # NEW: Generate synthetic data to file
│       └── AnalyzeDataForm.tsx     # NEW: Analyze data from file
└── lib/
    └── fileSystem.ts               # NEW: File system access helpers

scripts/
├── generateRandomPlaidData.ts      # Update: Flexible file paths
├── viewAssessmentObject.ts         # Update: Flexible file paths
└── lib/
    └── types/
        └── plaidData.ts            # Update: Re-export from src/types/plaid.ts

src/
└── types/
    └── plaid.ts                    # Keep as canonical type source
```

### Implementation Details

#### 1. Migrate Express Server to Vercel Serverless

**Delete:**
- `ui/app/main.ts` (Express server)
- Express-related scripts from `package.json`

**Create:** `/api/plaid/create-link-token.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: 'learning-cents-demo-user' },
      client_name: 'Learning Cents',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    res.status(200).json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
}
```

**Create:** `/api/plaid/exchange-token.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { public_token } = req.body;
  if (!public_token) {
    return res.status(400).json({ error: 'public_token required' });
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const accessToken = exchangeResponse.data.access_token;

    // Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Fetch transactions (last 180 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    // Fetch liabilities (credit card info)
    let liabilities: any[] = [];
    try {
      const liabilitiesResponse = await plaidClient.liabilitiesGet({
        access_token: accessToken,
      });
      liabilities = liabilitiesResponse.data.liabilities?.credit || [];
    } catch (error) {
      console.warn('Could not fetch liabilities');
    }

    // Return financial data
    res.status(200).json({
      accounts: accountsResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
      liabilities,
    });
  } catch (error: any) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
}
```

**Update:** `vite.config.ts` - Remove proxy (no longer needed for local dev with Vercel CLI)

**Update:** `package.json` scripts:
```json
{
  "dev": "vercel dev",
  "dev:ui": "vite",
  "build": "tsc && vite build",
  "deploy": "vercel --prod"
}
```

#### 2. Plaid Link Modal UI Flow

**Update:** `ui/pages/Home.tsx`
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import LoadingState from '../components/plaid/LoadingState';
import ErrorState from '../components/plaid/ErrorState';
import { useAssessment } from '../hooks/useAssessment';

export default function Home() {
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { loading, error, progress, generate, reset, setProgress } = useAssessment();

  // Fetch link token on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (err) {
        console.error('Failed to fetch link token:', err);
      }
    }
    fetchLinkToken();
  }, []);

  // Handle Plaid Link success
  const onSuccess = async (publicToken: string) => {
    try {
      setProgress({ stage: 'Exchanging token and fetching data...', percent: 20 });

      // Exchange token and fetch data
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const plaidData = await response.json();
      setProgress({ stage: 'Data received - preparing for analysis...', percent: 40 });

      // Generate assessment
      const assessment = await generate(plaidData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (err) {
      console.error('Error:', err);
      reset();
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  if (progress.percent > 0) {
    return <LoadingState stage={progress.stage} percent={progress.percent} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={reset} />;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto text-center pb-24">
        <h1 className="text-4xl font-bold mb-4">Learning Cents</h1>
        <p className="text-lg text-gray-600 mb-8">
          Get personalized financial education based on your transaction data
        </p>

        <div className="mb-8 space-y-4">
          <button
            onClick={() => open()}
            disabled={!ready}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-md"
          >
            {ready ? 'Connect with Plaid' : 'Loading...'}
          </button>

          <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <strong>Sandbox Test Credentials:</strong>
            <div className="mt-2 font-mono">
              <div>Username: <strong>user_transactions_dynamic</strong></div>
              <div>Password: <strong>(any value)</strong></div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-left">
          <strong>Story 11.5 Complete:</strong> Click "Connect with Plaid" to open the Link modal,
          enter test credentials, and generate a personalized assessment!
        </div>
      </div>

      {/* Sticky Disclaimer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto p-4 text-sm text-gray-600">
          <strong>Disclaimer:</strong> This is educational content, not financial advice.
          Consult a licensed advisor for personalized guidance.
        </div>
      </div>
    </>
  );
}
```

#### 3. Synthetic Data UI

**Create:** `ui/pages/SyntheticData.tsx`
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenerateDataForm from '../components/synthetic/GenerateDataForm';
import AnalyzeDataForm from '../components/synthetic/AnalyzeDataForm';

export default function SyntheticData() {
  const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Synthetic Data Tools</h1>
      <p className="text-gray-600 mb-8">
        Generate or analyze synthetic financial data for testing
      </p>

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Generate Data
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analyze'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analyze Data
          </button>
        </nav>
      </div>

      {activeTab === 'generate' ? <GenerateDataForm /> : <AnalyzeDataForm />}
    </div>
  );
}
```

**Create:** `ui/components/synthetic/GenerateDataForm.tsx`
```typescript
import { useState } from 'react';
import { generateSyntheticUsers } from '../../../scripts/lib/generators/userGenerator';
import { saveToFile } from '../../lib/fileSystem';

export default function GenerateDataForm() {
  const [userCount, setUserCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Generate synthetic users
      const users = generateSyntheticUsers(userCount);
      const dataset = {
        users,
        generated_at: new Date().toISOString(),
        count: users.length,
      };

      // Save to file using File System Access API
      await saveToFile(
        JSON.stringify(dataset, null, 2),
        `synthetic-data-${users.length}-users.json`,
        'application/json'
      );

      alert(`Successfully generated ${users.length} user(s) and saved to file!`);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate data. See console for details.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Users
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={userCount}
          onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Generate 1-100 synthetic users with realistic transaction patterns
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        {generating ? 'Generating...' : 'Generate & Save to File'}
      </button>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <strong>Note:</strong> This will generate synthetic data and prompt you to save it
        to your local file system. You can then analyze this data using the "Analyze Data" tab.
      </div>
    </div>
  );
}
```

**Create:** `ui/components/synthetic/AnalyzeDataForm.tsx`
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadFromFile } from '../../lib/fileSystem';
import { generateAssessmentFromPlaid } from '../../lib/assessmentGenerator';
import type { SyntheticDataset } from '../../../src/types/plaid';

export default function AnalyzeDataForm() {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Load file using File System Access API
      const fileContent = await loadFromFile('.json');
      const dataset: SyntheticDataset = JSON.parse(fileContent);

      // Validate structure
      if (!dataset.users || dataset.users.length === 0) {
        throw new Error('Invalid data structure: No users found');
      }

      // Use ONLY the first user (UI processes single records only)
      const user = dataset.users[0];
      const userData = {
        accounts: user.accounts,
        transactions: user.transactions,
        liabilities: user.liabilities,
      };

      console.log(`Analyzing first user: ${user.name.first} ${user.name.last}`);
      if (dataset.users.length > 1) {
        console.log(`Note: File contains ${dataset.users.length} users, processing only the first one`);
      }

      // Generate assessment
      const assessment = await generateAssessmentFromPlaid(userData);

      // Navigate to assessment page
      navigate('/assessment', { state: { assessment } });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Failed to analyze data. See console for details.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-700 mb-4">
          Load a synthetic data file (JSON) to analyze the first user's financial data
          and generate a personalized assessment.
        </p>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
      >
        {analyzing ? 'Analyzing...' : 'Load & Analyze File'}
      </button>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <strong>Single Record Processing:</strong> If your file contains multiple users,
        only the first user will be analyzed. Use CLI tools for batch processing.
      </div>
    </div>
  );
}
```

**Create:** `ui/lib/fileSystem.ts`
```typescript
/**
 * File System Access API helpers
 * Uses browser's File System Access API for reading/writing files
 */

export async function saveToFile(
  content: string,
  suggestedName: string,
  mimeType: string
): Promise<void> {
  try {
    // @ts-ignore - File System Access API
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'JSON Files',
          accept: { [mimeType]: ['.json'] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('User cancelled file save');
      throw new Error('File save cancelled');
    }
    throw error;
  }
}

export async function loadFromFile(extension: string): Promise<string> {
  try {
    // @ts-ignore - File System Access API
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON Files',
          accept: { 'application/json': [extension] },
        },
      ],
      multiple: false,
    });

    const file = await handle.getFile();
    return await file.text();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('User cancelled file selection');
      throw new Error('File selection cancelled');
    }
    throw error;
  }
}
```

#### 4. CLI File Path Flexibility

**Update:** `scripts/generateRandomPlaidData.ts`
```typescript
// Change hardcoded default
const options: CLIOptions = {
  count: 50,
  format: 'json',
  output: './data/synthetic-users' // Keep as default
};

// Update help message
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
```

**Update:** `scripts/viewAssessmentObject.ts`
```typescript
// Add --file flag for custom file paths
let filePath: string | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && i + 1 < args.length) {
    filePath = args[i + 1];
    i++;
  }
  // ... existing argument parsing
}

// Use custom file path if provided
if (source === 'synthetic') {
  const dataPath = filePath || './data/synthetic-users.json';
  // ... rest of implementation
}
```

#### 5. Type Consolidation

**Update:** `scripts/lib/types/plaidData.ts`
```typescript
/**
 * Re-export Plaid types from canonical source
 * All types are defined in src/types/plaid.ts
 */

export type {
  PlaidAccount,
  PlaidTransaction,
  PlaidLiability,
  UserFinancialData,
  SyntheticDataset,
  PlaidRecurringStream,
} from '../../../src/types/plaid';

// PlaidUser is specific to synthetic data generation
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
```

**Verify:** `src/types/plaid.ts` remains the canonical source with all type definitions.

#### 6. Fix ESLint Errors & Create vercel.json

**Current ESLint Errors (6 errors blocking CI/CD):**

1. **scripts/explorePlaidSandbox.ts:13**
   - Remove unused import: `SandboxItemFireWebhookRequestWebhookCodeEnum`
   ```diff
   - import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, SandboxItemFireWebhookRequestWebhookCodeEnum, Transaction } from 'plaid';
   + import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode, Transaction } from 'plaid';
   ```

2. **ui/app/main.ts:222**
   - **ENTIRE FILE DELETED** as part of Express → Vercel migration
   - This fixes unused `error` variable issue

3. **ui/components/plaid/LoadingState.tsx:12**
   - `percent` parameter defined but never used
   - **Fix:** Add progress bar to component:
   ```tsx
   export default function LoadingState({ stage, percent }: LoadingStateProps) {
     const displayStage = stage || 'Connecting to Plaid Sandbox...';

     return (
       <div className="max-w-md mx-auto text-center mt-20">
         <div className="mb-6">
           <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
         </div>
         <div className="text-xl font-semibold text-gray-900 mb-4">{displayStage}</div>

         {/* Add progress bar */}
         <div className="w-full bg-gray-200 rounded-full h-2">
           <div
             className="bg-blue-600 h-2 rounded-full transition-all duration-300"
             style={{ width: `${percent}%` }}
           ></div>
         </div>
         <div className="text-sm text-gray-600 mt-2">{percent}%</div>
       </div>
     );
   }
   ```

4. **ui/pages/Assessment.tsx:16**
   - `navigate` imported but never used
   ```diff
   - import { useLocation, useNavigate } from 'react-router-dom';
   + import { useLocation } from 'react-router-dom';

   export default function Assessment() {
     const location = useLocation();
   -   const navigate = useNavigate();
   ```

5. **ui/pages/Home.tsx:8**
   - `useState` imported but never used
   ```diff
   - import { useState } from 'react';
   ```

6. **ui/pages/Home.tsx:18**
   - `loading` destructured but never used from `useAssessment()`
   ```diff
   - const { loading, error, progress, generate, reset, setProgress } = useAssessment();
   + const { error, progress, generate, reset, setProgress } = useAssessment();
   ```

**Create vercel.json:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Install @vercel/node:**
```bash
npm install -D @vercel/node
```

**Update package.json scripts:**
```json
{
  "dev": "vercel dev",
  "dev:ui": "vite",
  "build": "tsc && vite build",
  "deploy": "vercel --prod"
}
```

**Remove proxy from vite.config.ts:**
```diff
   resolve: {
     // ... aliases
   },
-  server: {
-    proxy: {
-      '/api': {
-        target: 'http://localhost:3001',
-        changeOrigin: true,
-      },
-    },
-  },
   build: {
     outDir: 'dist',
     emptyOutDir: true,
   },
```

### Acceptance Criteria

- [ ] Express server removed, Vercel serverless functions implemented
- [ ] Plaid Link modal opens with test credentials displayed
- [ ] Users can connect Plaid account via modal (not bypass)
- [ ] Synthetic data generation UI writes to local file system
- [ ] Synthetic data analysis UI reads from local file system
- [ ] UI only processes first user from multi-user files
- [ ] CLI tools accept custom file paths (--output, --file flags)
- [ ] CLI tools default to ./data/ directory when no path specified
- [ ] Types consolidated: scripts/lib/types imports from src/types
- [ ] No duplicate type definitions
- [ ] All imports updated to use canonical types
- [ ] CLI tools quick reference updated with new flags
- [ ] **All 6 ESLint errors fixed**
- [ ] **vercel.json created with correct configuration**
- [ ] **@vercel/node installed**
- [ ] **npm run lint passes with no errors**
- [ ] **GitHub Actions CI/CD passes**
- [ ] **Vercel deployment succeeds**

### Testing

**Vercel serverless:**
```bash
# Install Vercel CLI
npm install -g vercel

# Run development server
vercel dev

# Test Plaid endpoints
curl -X POST http://localhost:3000/api/plaid/create-link-token
```

**Plaid Link modal:**
- Open app, click "Connect with Plaid"
- Verify modal opens
- Enter test credentials: `user_transactions_dynamic` / (any password)
- Verify connection succeeds and assessment generates

**Synthetic data UI:**
- Navigate to /synthetic-data
- Generate 1 user, save to file
- Analyze saved file
- Verify assessment displays

**CLI flexibility:**
```bash
# Test custom output paths
npm run generate:data -- --count 5 --output ~/test-data

# Test custom input paths
npm run run:assessment -- --file ~/test-data.json
```

**Type consolidation:**
```bash
# Run type check
npm run typecheck

# Verify no errors
```

**ESLint & CI/CD:**
```bash
# Run lint locally
npm run lint

# Should show: ✔ No problems found

# Verify GitHub Actions passes
git push

# Check workflow at: https://github.com/<your-repo>/actions
```

**Vercel deployment:**
```bash
# Test local Vercel build
vercel build

# Should output to dist/ directory

# Deploy preview
vercel

# Deploy production
vercel --prod
```

---

## Phase 3 Completion Checklist

### Story 8: Frontend Setup
- [ ] Vite + React + TypeScript project created
- [ ] Tailwind CSS configured
- [ ] React Router setup
- [ ] Layout component working
- [ ] UI component library created
- [ ] NO authentication (deferred to Phase 4)

### Story 9: Assessment Display UI
- [ ] Assessment display page renders
- [ ] Priority insight and additional insights display
- [ ] Education items show for each insight
- [ ] Decision tree displays
- [ ] Expand/collapse for additional insights works
- [ ] Responsive design verified

### Story 10: Plaid Integration (Sandbox)
- [ ] Plaid Link SDK installed
- [ ] Sandbox configuration set
- [ ] Client-side assessment generator working
- [ ] Data flushing verified
- [ ] Types properly defined

### Story 11: Plaid Connection UI
- [ ] Plaid Connect button works
- [ ] Loading states display
- [ ] Error handling works
- [ ] Assessment generates from Plaid data
- [ ] Retry functionality works

### Story 11.5: Architecture Cleanup & Synthetic Data UI
- [ ] Express server migrated to Vercel serverless functions
- [ ] Plaid Link modal implemented (not bypass)
- [ ] Test credentials displayed on screen
- [ ] Synthetic data generation UI works
- [ ] Synthetic data analysis UI works
- [ ] UI processes only first user from files
- [ ] CLI accepts custom file paths
- [ ] Types consolidated (no duplicates)

### Integration Test
- [ ] Full flow: Connect Plaid → Generate assessment → Display
- [ ] Works with Plaid Sandbox test credentials
- [ ] No server persistence (client-side only)
- [ ] Performance acceptable (<2 seconds for assessment generation)
- [ ] UI responsive on mobile and desktop

---

## Next Steps

After completing Phase 3, move to Phase 4: Server & Authentication (Stories 12-17)
See `phase-4.md` for detailed implementation guide.
