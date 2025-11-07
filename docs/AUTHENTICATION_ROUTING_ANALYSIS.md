# Learning Cents Authentication & Routing Analysis

## Overview

Learning Cents uses Supabase for authentication, React Router for client-side routing, and Vercel API routes for backend endpoints. The app implements a consent-based workflow where users must grant consent after signup before accessing main features.

---

## 1. Main App Component & Routing Setup

**File:** `/Users/shumway/Developer/learn-cents/ui/app/App.tsx`

### Routing Structure:

```
BrowserRouter
├── AuthProvider (wraps entire app)
└── Routes
    ├── /login                    → Login page (public)
    ├── /signup                   → Signup page (public)
    ├── /consent                  → Consent page (public)
    └── /* (Layout wrapper)
        ├── /                     → Home page
        ├── /assessment           → Assessment page
        ├── /synthetic-data       → Synthetic Data page
        ├── /settings             → Settings page
        ├── /admin                → Admin Dashboard
        ├── /admin/users/:userId  → Admin User Detail
        └── * (catch-all)         → 404 Not Found
```

### Key Points:

- **No ProtectedRoute wrapping** - Routes are currently accessible without authentication
- All non-auth pages wrapped in `Layout` component (Header + Footer)
- Auth pages (/login, /signup, /consent) are **outside** the Layout wrapper
- Admin routes exist but are not protected/gated

---

## 2. Authentication Context & State Management

**File:** `/Users/shumway/Developer/learn-cents/ui/contexts/AuthContext.tsx`

### AuthContext Structure:

```typescript
interface AuthContextType {
  user: AuthUser | null; // Currently logged in user
  loading: boolean; // Auth state loading
  signOut: () => Promise<void>; // Sign out function
}

type AuthUser = {
  id: string;
  email: string;
};
```

### Features:

- Uses Supabase `onAuthStateChange()` listener for reactive auth updates
- Checks for existing session on mount via `getCurrentSession()`
- Automatic subscription cleanup on unmount
- Provides `useAuth()` hook for accessing auth state in components

### Current Implementation Issues:

- Context does NOT track consent status
- No distinction between authenticated but unconsentenced users
- Cannot determine if user should be on consent page vs main app

---

## 3. Authentication-Related Components & Pages

### A. Login Page (`/Users/shumway/Developer/learn-cents/ui/pages/Login.tsx`)

**Route:** `/login`

- Email/password login form
- Uses `signIn()` from auth library
- Redirects to home (`/`) on success
- No pre-login checks

### B. Signup Page (`/Users/shumway/Developer/learn-cents/ui/pages/Signup.tsx`)

**Route:** `/signup`

- Email/password signup form
- Password validation (8+ chars, confirmation match)
- Calls `signUp()` which:
  1. Creates user in Supabase
  2. Syncs user to database via `/api/auth/sync-user`
  3. Redirects to `/consent` page on success
- User's `consentStatus` defaults to `false` during sync

### C. Consent Page (`/Users/shumway/Developer/learn-cents/ui/pages/Consent.tsx`)

**Route:** `/consent`

- **Purpose:** Privacy & consent disclosure + opt-in
- **Current Flow:**
  - User signs up → redirected here
  - User can grant or deny consent
  - Grant consent: calls `/api/consent/grant` → redirects to `/`
  - Deny consent: redirects to `/` (no enforcement)

**Content Explains:**

- What data is collected: assessments, eligibility metrics, decision trees
- What is NOT stored: raw financial data, Plaid tokens
- User rights: can revoke consent, delete data, prevents future processing

### D. Settings Page (`/Users/shumway/Developer/learn-cents/ui/pages/Settings.tsx`)

**Route:** `/settings` (authenticated users)

- Shows account information
- **Consent Management Section:**
  - Displays current consent status
  - Shows consent grant date
  - Can revoke consent (calls `/api/consent/revoke`)
  - Can delete account (calls `/api/user/delete-account`)
- Modal confirmations for destructive actions

---

## 4. Protected Routes Implementation

**File:** `/Users/shumway/Developer/learn-cents/ui/components/auth/ProtectedRoute.tsx`

### Current State:

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

### Issues:

- **Not Currently Used** - No routes wrapped with ProtectedRoute
- Only checks authentication, NOT consent status
- Would redirect authenticated-but-unconsentenced users to login (wrong destination)

---

## 5. Consent-Related Code

### Frontend Consent Flow:

1. **After Signup:** User redirected to `/consent`
2. **Consent Page:** User reads disclosure and grants/denies
3. **Grant Consent:**
   - POST to `/api/consent/grant` with auth token
   - Sets `consentStatus = true` and `consentDate` in database
   - Redirects to home
4. **Settings:** User can revoke consent via `/settings`

### Backend Consent Endpoints:

#### 1. `/api/consent/grant` (POST)

- Authenticates via Bearer token
- Updates user record: `consentStatus = true`, sets `consentDate`
- Returns updated consent status

#### 2. `/api/consent/status` (GET)

- Authenticates via Bearer token
- Returns user's `consentStatus` and `consentDate`
- Used by Settings page to check status

#### 3. `/api/consent/revoke` (POST)

- Authenticates via Bearer token
- Updates user record: `consentStatus = false`, clears `consentDate`
- Does NOT delete data automatically

### Database Schema:

The Prisma user model likely includes:

```prisma
model User {
  id              String
  email           String
  consentStatus   Boolean  (default: false)
  consentDate     DateTime? (nullable)
  // ... other fields
}
```

---

## 6. Authentication Library Functions

**File:** `/Users/shumway/Developer/learn-cents/ui/lib/auth.ts`

### Available Functions:

```typescript
// Sign up with email/password
signUp(email: string, password: string): Promise<AuthUser>
  ├─ Creates Supabase auth user
  ├─ Calls POST /api/auth/sync-user
  └─ Returns user id + email

// Sign in with email/password
signIn(email: string, password: string): Promise<AuthUser>
  └─ Uses Supabase auth, returns user data

// Sign out
signOut(): Promise<void>
  └─ Clears Supabase session

// Get current session
getCurrentSession(): Promise<AuthUser | null>
  └─ Called on app mount to restore session

// Get access token
getAccessToken(): Promise<string | null>
  └─ Retrieves Supabase JWT for API requests
```

---

## 7. Header/Navigation Component

**File:** `/Users/shumway/Developer/learn-cents/ui/components/layout/Header.tsx`

### Conditional Navigation:

- **Unauthenticated Users:**
  - Sign in button → `/login`
  - Sign up button → `/signup`
- **Authenticated Users:**
  - Shows user email
  - Sign out button
  - Settings link → `/settings`

### Always Visible:

- Home link
- Synthetic Data link

---

## 8. Current System Issues & Gaps

### Critical Issues:

1. **No Route Protection:**
   - All routes in Layout accessible without authentication
   - Unauthenticated users can access `/assessment`, `/settings`, `/admin`
   - ProtectedRoute component exists but is unused

2. **Consent Not Enforced:**
   - Denying consent on `/consent` page redirects to home (no enforcement)
   - No check that user granted consent before accessing main features
   - Settings page allows unsigned-in users (but endpoint requires auth token)

3. **No Consent in Auth Context:**
   - AuthContext doesn't track consent status
   - Components must separately fetch consent status
   - No way to know if user is at "signed up but not consented" stage

4. **Unclear Post-Signup Flow:**
   - Signup flow ends at `/consent` but that page is also public
   - User could skip `/consent` and go directly to `/` or other routes
   - No enforcement of consent before feature access

### Design Issues:

1. Settings route (typically user-only) is not protected
2. Admin routes have no access control
3. Consent page is generic route without forced flow

---

## 9. File Locations Summary

### Frontend Files:

```
/Users/shumway/Developer/learn-cents/ui/
├── app/
│   └── App.tsx                           # Main routing
├── contexts/
│   └── AuthContext.tsx                   # Auth state + provider
├── pages/
│   ├── Login.tsx                         # Login page
│   ├── Signup.tsx                        # Signup page
│   ├── Consent.tsx                       # Consent disclosure
│   ├── Settings.tsx                      # User settings + consent mgmt
│   ├── Home.tsx                          # Landing/Plaid connect
│   ├── Assessment.tsx                    # Results page
│   ├── SyntheticData.tsx                 # Synthetic data page
│   ├── NotFound.tsx                      # 404 page
│   └── admin/
│       ├── Dashboard.tsx
│       └── UserDetail.tsx
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx           # Protected route wrapper (unused)
│   ├── layout/
│   │   ├── Layout.tsx                   # Page wrapper
│   │   ├── Header.tsx                   # Navigation header
│   │   └── Footer.tsx
│   └── ... (other UI components)
└── lib/
    └── auth.ts                          # Auth functions
```

### Backend API Files:

```
/Users/shumway/Developer/learn-cents/api/
├── auth/
│   └── sync-user.ts                     # POST /api/auth/sync-user
├── consent/
│   ├── grant.ts                         # POST /api/consent/grant
│   ├── status.ts                        # GET /api/consent/status
│   └── revoke.ts                        # POST /api/consent/revoke
├── user/
│   └── delete-account.ts                # POST /api/user/delete-account
└── ... (other endpoints)
```

---

## 10. Recommended Next Steps

1. **Extend AuthContext:**
   - Add `consentStatus` and `consentDate` to AuthContextType
   - Fetch consent status on auth check

2. **Create Route Protection:**
   - Wrap Layout routes with proper ProtectedRoute
   - Create separate ProtectedRoute that checks BOTH auth AND consent
   - Redirect unconsentenced users back to `/consent`

3. **Enforce Consent Flow:**
   - After signup, users must visit `/consent` (not optional)
   - `/consent` page should not be accessible to already-consented users
   - Settings page should be protected (auth required)

4. **Add Admin Access Control:**
   - Add role/permission checking
   - Protect `/admin` routes appropriately

5. **Test Missing Edge Cases:**
   - User bypasses consent page after signup
   - User visits consent page when already consented
   - User visits protected routes while unauthenticated
   - User access after revoking consent
